use anyhow::anyhow;
use std::process;
use tokio::runtime::Runtime;

mod image;
mod input;

use image::handler as image_handler;

fn run() -> anyhow::Result<()> {
    ctrlc::set_handler(|| {
        cliclack::outro_cancel(console::style("Cancelled!").magenta()).unwrap();
        console::Term::stdout().show_cursor().unwrap();
        process::exit(0);
    })
    .expect("Error occurred in registering handler");

    let (read_dir, output_dir) =
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

    let process_spinner = cliclack::spinner();
    process_spinner.start("Processing...");

    let mut success_num = 0;
    let mut failed_tasks: Vec<(String, String)> = vec![];

    let rt = Runtime::new().unwrap();
    let _ = rt.block_on(image_handler::process_images(
        read_dir,
        filter_option,
        output_dir,
        &mut |(filename, result)| {
            match result {
                Ok(resolution) => {
                    success_num += 1;
                    process_spinner.start(format!(
                        "Processing...\n\n{}",
                        console::style(format!("{} -> {}", filename, resolution)).dim()
                    ));
                }
                Err(err_msg) => {
                    failed_tasks.push((filename, err_msg));
                }
            };
        },
    ));

    process_spinner.stop("Finish!");

    if failed_tasks.is_empty() {
        cliclack::outro(console::style(format!("Done {success_num} images.")).green())?;
    } else if success_num == 0 {
        cliclack::outro_cancel("All failed")?;
    } else {
        cliclack::outro(format!(
            "{}, {}{}\n\n",
            console::style(format!("Done {success_num} images")).green(),
            console::style(format!("{} images failed", failed_tasks.len())).red(),
            {
                failed_tasks
                    .iter()
                    .fold(String::new(), |result_str, (file, err_msg)| {
                        format!(
                            "\n   {}\n    {}",
                            console::style(file).red(),
                            console::style(err_msg).red().dim()
                        ) + &result_str
                    })
            }
        ))?;
    }

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
