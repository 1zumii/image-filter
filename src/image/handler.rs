use image::{GenericImageView, ImageReader};
use std::{
    fs,
    path::{Path, PathBuf},
    time,
};
use tokio::task;

pub async fn process_images(read_dir: PathBuf) -> anyhow::Result<()> {
    let mut tasks = task::JoinSet::new();

    // DEBUG:
    let now = time::Instant::now();

    visit_dirs(read_dir.as_path(), &mut |entry| {
        // TODO:
        // 1. asynchronous open image
        // 2. process result

        // dbg!(entry.file_name()); 3.149ms
        // let _todo = image_handler::process_image(entry);

        let path = entry.path();

        tasks.spawn(async {
            let _ = process_image(path).await;
        });
    })?;

    while let Some(res) = tasks.join_next().await {
        res.unwrap();
    }

    // DEBUG:
    let elapsed = now.elapsed();
    println!("Elapsed: {:.3?}", elapsed);

    Ok(())
}

fn visit_dirs(dir: &Path, process_file: &mut dyn FnMut(&fs::DirEntry)) -> anyhow::Result<()> {
    if !dir.is_dir() {
        return Ok(());
    }

    for entry in fs::read_dir(dir)? {
        let entry = entry?;
        let path = entry.path();
        if path.is_dir() {
            visit_dirs(&path, process_file)?;
        } else {
            process_file(&entry);
        }
    }

    Ok(())
}

async fn process_image(path: PathBuf) -> anyhow::Result<()> {
    let img = ImageReader::open(&path)?.decode()?; // TODO: If no format was determined, returns an ImageError::Unsupported.

    let (width, height) = img.dimensions();

    dbg!(path, width, height);

    Ok(())
}
