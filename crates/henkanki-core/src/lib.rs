//! Portable, dependency-free planning primitives used by future native Henkanki clients.

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum SupportLevel { Official, Supported, Experimental, Planned }

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Format { pub id: &'static str, pub family: &'static str, pub support: SupportLevel }

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ConversionPlan { pub from: &'static str, pub to: &'static str, pub operation: &'static str, pub requirements: Vec<&'static str> }

pub fn known_format(id: &str) -> Option<Format> {
    let (family, support) = match id {
        "json" | "yaml" | "toml" | "xml" | "csv" | "tsv" | "ndjson" => ("structured", SupportLevel::Official),
        "text" | "markdown" | "html" | "base64" | "url" | "hex" => ("text", SupportLevel::Official),
        "png" | "jpeg" | "webp" | "gif" | "svg" => ("image", SupportLevel::Supported),
        "pdf" | "docx" | "xlsx" | "pptx" => ("document", SupportLevel::Supported),
        "mp3" | "wav" | "mp4" | "webm" => ("media", SupportLevel::Supported),
        "zip" | "tar" | "gz" => ("archive", SupportLevel::Supported),
        _ => return None,
    };
    Some(Format { id: Box::leak(id.to_owned().into_boxed_str()), family, support })
}

pub fn plan(from: &'static str, to: &'static str) -> Option<ConversionPlan> {
    let source = known_format(from)?; let target = known_format(to)?;
    if source.family == "structured" && target.family == "structured" { return Some(ConversionPlan { from, to, operation: "structured", requirements: vec![] }); }
    if source.family == "text" && target.family == "text" { return Some(ConversionPlan { from, to, operation: "text-codec", requirements: vec![] }); }
    if source.family == "media" && target.family == "media" { return Some(ConversionPlan { from, to, operation: "media", requirements: vec!["ffmpeg"] }); }
    None
}
