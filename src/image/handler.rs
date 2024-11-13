use anyhow::anyhow;
use image::{GenericImageView, ImageReader};
use std::{
    cmp, fs,
    path::{Path, PathBuf},
};
use tokio::task;

use crate::input::{FilterOption, ResolutionFilterOption};

use super::{Ratio, Resolution};

pub async fn process_images(
    read_dir: PathBuf,
    option: FilterOption,
    output_dir: PathBuf,
    on_finish: &mut dyn FnMut((String, Result<Resolution, String>)),
) -> anyhow::Result<()> {
    // DEBUG:
    // let now = time::Instant::now();

    let mut tasks = task::JoinSet::new();

    visit_dirs(read_dir.as_path(), &mut |entry| {
        let path = entry.path();
        let option = option.clone(); // REFACTOR: maybe pass reference, although option's struct is small enough

        let file = path
            .file_name()
            .ok_or(anyhow!("Error occurred in parsing filename"))?
            .to_str()
            .ok_or(anyhow!("Error occurred in parsing filename"))?
            .to_string();
        let save_path = output_dir.clone().join(&file);

        // DEBUG:
        // let oo = output_dir.clone();

        tasks.spawn(async move {
            let result = process_image(path, option, save_path).await;

            match result {
                Ok(None) => Ok(None),
                Ok(Some(resolution)) => Ok(Some((file, resolution))),
                Err(e) => Err((file, e)),
            }
        });

        Ok(())
    })?;

    while let Some(res) = tasks.join_next().await {
        match res {
            Ok(res) => match res {
                Ok(None) => (),
                Ok(Some((filename, resolution))) => on_finish((filename, Ok(resolution))),
                Err((filename, err)) => on_finish((filename, Err(err.to_string()))),
            },
            Err(_) => todo!(),
        }
    }

    // DEBUG:
    // let elapsed = now.elapsed();
    // println!("Elapsed: {:.3?}", elapsed);

    Ok(())
}

fn visit_dirs(
    dir: &Path,
    process_file: &mut dyn FnMut(&fs::DirEntry) -> anyhow::Result<()>,
) -> anyhow::Result<()> {
    if !dir.is_dir() {
        return Ok(());
    }

    for entry in fs::read_dir(dir)? {
        let entry = entry?;
        let path = entry.path();
        if path.is_dir() {
            visit_dirs(&path, process_file)?;
        } else {
            process_file(&entry)?;
        }
    }

    Ok(())
}

fn max_common_divisor(a: u32, b: u32) -> u32 {
    let mut arr = [a, b];
    arr.sort();
    let [a, b] = arr;

    if b % a == 0 {
        a
    } else {
        max_common_divisor(a, b % a)
    }
}

// calculate maximal width and height of image that satisfy exact ratio, and sides are integer
fn calc_max_image_size_by_ratio(resolution: Resolution, ratio: Ratio) -> Resolution {
    let ratio_width = u32::from(ratio.width);
    let ratio_height = u32::from(ratio.height);

    let unit_length = cmp::min(
        resolution.width / ratio_width,
        resolution.height / ratio_height,
    );

    Resolution::from((unit_length * ratio_width, unit_length * ratio_height))
}

async fn process_image(
    path: PathBuf,
    option: FilterOption,
    save_path: PathBuf,
) -> anyhow::Result<Option<Resolution>> {
    let mut img = ImageReader::open(&path)?.decode()?; // TODO: If no format was determined, returns an ImageError::Unsupported.

    let (width, height) = img.dimensions();

    // resolution
    if let Some((option, resolution)) = option.resolution {
        let pass_filter = match option {
            ResolutionFilterOption::AtLeast => {
                width >= resolution.width && height >= resolution.height
            }
            ResolutionFilterOption::Exactly => {
                width == resolution.width && height == resolution.height
            }
        };

        if !pass_filter {
            return Ok(None);
        }
    }

    // ratio
    if let Some((option, ratio)) = option.ratio {
        let divisor = max_common_divisor(width, height);

        match option {
            crate::input::RatioFilterOption::FilterOnly => {
                if !(width / divisor == ratio.width.into()
                    && height / divisor == ratio.height.into())
                {
                    // return Ok(None);
                    // DEBUG:
                    return Err(anyhow!("Test error"));
                }
            }
            crate::input::RatioFilterOption::Crop => {
                let Resolution { width, height } =
                    calc_max_image_size_by_ratio(Resolution::from((width, height)), ratio);

                img = img.crop_imm(0, 0, width, height);
            }
        }
    }

    // REFACTOR: seem compressed, even just save without crop
    match img.save(save_path) {
        Ok(_) => Ok(Some(Resolution::from((width, height)))),
        Err(_) => Err(anyhow!("Error occurred in saving result")),
    }
}
