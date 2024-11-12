use anyhow::anyhow;
use std::process;
use tokio::runtime::Runtime;

mod image;
mod input;

use image::handler as image_handler;

fn run() -> anyhow::Result<()> {
    let (read_dir, output_dir) = // TODO: unused var
        input::get_process_dir().unwrap_or_else(|e| handle_error(e, false));

    let read_dir_name = &read_dir
        .file_name()
        .ok_or(anyhow!("Error occurred in parsing directory"))?
        .to_str()
        .ok_or(anyhow!("Error occurred in parsing directory"))
        .unwrap_or_else(|e| handle_error(e, false));
    cliclack::intro(
        console::style(format!(" {} ", read_dir_name))
            .on_cyan()
            .black(),
    )?;

    let filter_option = input::get_filter_option()?;

    let read_files_spinner = cliclack::spinner();
    read_files_spinner.start("Collecting...");

    let rt = Runtime::new().unwrap();
    let _ = rt.block_on(image_handler::process_images(
        read_dir,
        filter_option,
        output_dir,
    ));

    read_files_spinner.stop("Done!");

    Ok(())
}

fn main() {
    let _ = run().map_err(|e| handle_error(e, true));
}

fn handle_error(e: anyhow::Error, after_intro: bool) -> ! {
    if after_intro {
        let _ = cliclack::outro(console::style(format!("{e}")).red());
    } else {
        println!("{}", console::style(format!("{e}")).red());
    }

    process::exit(1);
}
