use crate::image::{Ratio, Resolution};

#[derive(Clone, PartialEq, Eq, Debug)]
pub enum ResolutionFilterOption {
    AtLeast,
    Exactly,
}

impl ResolutionFilterOption {
    pub fn options() -> Vec<(Option<Self>, String, &'static str)> {
        vec![
            (Some(Self::AtLeast), "At Least".into(), ""),
            (Some(Self::Exactly), "Exactly".into(), ""),
            (None, "Off".into(), ""),
        ]
    }
}

#[derive(Clone, PartialEq, Eq, Debug)]
pub enum RatioFilterOption {
    FilterOnly,
    Crop,
}

impl RatioFilterOption {
    pub fn options() -> Vec<(Option<Self>, String, &'static str)> {
        vec![
            (Some(Self::FilterOnly), "Filter Only".into(), ""),
            (Some(Self::Crop), "Crop".into(), ""),
            (None, "Off".into(), ""),
        ]
    }
}

#[derive(Clone)]
pub struct FilterOption {
    pub resolution: Option<(ResolutionFilterOption, Resolution)>,
    pub ratio: Option<(RatioFilterOption, Ratio)>,
}
