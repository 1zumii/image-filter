pub mod constants;

use std::fmt::Display;

#[derive(Clone, PartialEq, Eq, Debug)]
pub struct Resolution {
    width: u16,
    height: u16,
}

impl Display for Resolution {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}×{}", self.width, self.height)
    }
}

impl From<(u16, u16)> for Resolution {
    fn from((width, height): (u16, u16)) -> Self {
        Self { width, height }
    }
}

#[derive(Clone, PartialEq, Eq, Debug)]
pub struct Ratio {
    width: u8,
    height: u8,
}

impl Display for Ratio {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}:{}", self.width, self.height)
    }
}

impl From<(u8, u8)> for Ratio {
    fn from((width, height): (u8, u8)) -> Self {
        Self { width, height }
    }
}
