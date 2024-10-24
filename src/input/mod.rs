mod filter_option;

use anyhow::{anyhow, Context};
use filter_option::ResolutionFilterOption;
use std::{env, fs, path::Path};

use crate::image::{
    constants::{RATIO_OPTIONS, RESOLUTION_OPTIONS},
    Ratio, Resolution,
};

pub fn get_process_dir() -> anyhow::Result<(String, fs::ReadDir)> {
    let args: Vec<String> = env::args().collect();

    // args[0] is exec path
    if args.len() != 2 {
        return Err(anyhow!("Only accept one argument as input path."));
    }

    let path = Path::new(&args[1]);
    let read_dir =
        fs::read_dir(path).context("Input path is not an existing or accessible directory")?;

    let dir_name = path
        .file_name()
        .ok_or(anyhow!("Error occurred in parsing directory"))?
        .to_str()
        .ok_or(anyhow!("Error occurred in parsing directory"))?
        .to_string();

    Ok((dir_name, read_dir))
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

fn filter_by_ratio() -> Option<Ratio> {
    let Ok(true) = cliclack::confirm("Filter by ratio: ").interact() else {
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

    Some(ratio)
}

pub fn get_config() -> anyhow::Result<()> {
    let result_1 = filter_by_resolution();
    let result_2 = filter_by_ratio();

    dbg!(result_1, result_2);
    // TODO:
    Ok(())
}
