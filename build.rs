/// note: update this as new versions are released
const KINODE_URL: &str = "https://github.com/kinode-dao/kinode/releases/download/v0.9.2/";
const APPLE_SILICON_BINARY: &str = "kinode-arm64-apple-darwin.zip";
const APPLE_INTEL_BINARY: &str = "kinode-x86_64-apple-darwin.zip";
const LINUX_BINARY: &str = "kinode-x86_64-unknown-linux-gnu.zip";

fn main() {
    // if bin directory exists, skip downloading
    if std::fs::metadata("bin").is_ok() {
        tauri_build::build();
        return;
    }

    // download kinode binary -- need both for cross-platform builds
    let apple_silicon_binary_url = format!("{}{}", KINODE_URL, APPLE_SILICON_BINARY);
    let apple_intel_binary_url = format!("{}{}", KINODE_URL, APPLE_INTEL_BINARY);
    let linux_binary_url = format!("{}{}", KINODE_URL, LINUX_BINARY);

    std::fs::create_dir_all("bin").expect("Failed to create bin directory");

    // for some reason tauri wants aarch64 not arm64
    download_and_unzip_binary(&apple_silicon_binary_url, "aarch64-apple-darwin");
    download_and_unzip_binary(&apple_intel_binary_url, "x86_64-apple-darwin");
    download_and_unzip_binary(&linux_binary_url, "x86_64-unknown-linux-gnu");

    tauri_build::build();
}

fn download_and_unzip_binary(url: &str, triple: &str) {
    let path = format!("bin/{}.zip", triple);

    let mut response = reqwest::blocking::get(url).expect("Failed to download binary");
    let mut file = std::fs::File::create(&path).expect("Failed to create file");
    std::io::copy(&mut response, &mut file).expect("Failed to copy file");

    // need to re-open as zip
    let zip_file = std::fs::File::open(&path).expect("Failed to open archive");
    let mut archive = zip::read::ZipArchive::new(zip_file).expect("Failed to open zip");
    let mut binary = archive.by_name("kinode").expect("Failed to find binary");

    // save binary to bin folder with its triple appended
    let binary_path = format!("bin/kinode-0.9.2-{}", triple);
    std::io::copy(
        &mut binary,
        &mut std::fs::File::create(&binary_path).expect("Failed to create binary file"),
    )
    .expect("Failed to copy binary");
}
