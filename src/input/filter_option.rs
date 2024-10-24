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
