mod image;
mod input;

fn run() -> anyhow::Result<()> {
    // TODO: read_dir
    let (dir_name, _read_dir) = input::get_process_dir()?;

    cliclack::intro(console::style(format!(" {dir_name} ")).on_cyan().black())?;
    input::get_config()?;

    Ok(())
}

fn main() {
    let _ = run().map_err(|e| {
        println!("{e}");
    });
}
