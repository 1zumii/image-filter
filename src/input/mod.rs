mod filter_option;

pub use filter_option::{FilterOption, RatioFilterOption, ResolutionFilterOption};

use anyhow::anyhow;
use std::{
    env,
    path::{Path, PathBuf},
};

use crate::image::{
    constants::{RATIO_OPTIONS, RESOLUTION_OPTIONS},
    Ratio, Resolution,
};

pub fn get_process_dir() -> anyhow::Result<(PathBuf, PathBuf)> {
    let args: Vec<String> = env::args().collect();

    // args[0] is exec path
    if args.len() != 3 {
        return Err(anyhow!("Pass in two arguments for input and output path"));
    }

    let read_dir_path = Path::new(&args[1]).to_owned();
    let output_dir_path = Path::new(&args[2]).to_owned();
    if !read_dir_path.is_dir() {
        return Err(anyhow!(
            "Input path is not an existing or accessible directory"
        ));
    }
    if !output_dir_path.is_dir() {
        return Err(anyhow!(
            "Output path is not an existing or accessible directory"
        ));
    }

    Ok((read_dir_path, output_dir_path))
}

fn filter_by_resolution() -> Option<(ResolutionFilterOption, Resolution)> {
    let Ok(Some(selected_option)) = cliclack::select("Filter by resolution: ")
        .items(&ResolutionFilterOption::options())
        .interact()
    else {
        return None;
    };

    cliclack::log::info(format!("📏 {}", console::style("width × height").dim())).ok();

    let Ok(resolution) = cliclack::select("Choose a resolution: ")
        .items(
            &RESOLUTION_OPTIONS
                .into_iter()
                .map(|((width, height), hint)| {
                    let r = Resolution::from((width, height));
                    let l = format!("{}", &r);
                    (r, l, hint)
                })
                .collect::<Vec<(_, String, &'static str)>>(),
        )
        .filter_mode()
        .interact()
    else {
        return None;
    };

    Some((selected_option, resolution))
}

fn filter_by_ratio() -> Option<(RatioFilterOption, Ratio)> {
    let Ok(Some(selected_option)) = cliclack::select("Filter by ratio: ")
        .items(&RatioFilterOption::options())
        .interact()
    else {
        return None;
    };

    cliclack::log::info(format!("📏 {}", console::style("width : height").dim())).ok();

    let Ok(ratio) = cliclack::select("Choose a ratio: ")
        .items(
            &RATIO_OPTIONS
                .into_iter()
                .map(|((width, height), hint)| {
                    let r = Ratio::from((width, height));
                    let l = format!("{}", &r);
                    (r, l, hint)
                })
                .collect::<Vec<(_, String, &'static str)>>(),
        )
        .filter_mode()
        .interact()
    else {
        return None;
    };

    Some((selected_option, ratio))
}

pub fn get_filter_option() -> anyhow::Result<FilterOption> {
    let resolution = filter_by_resolution();
    let ratio = filter_by_ratio();

    Ok(FilterOption { resolution, ratio })
}
