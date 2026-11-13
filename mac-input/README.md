# 0.5.1 Mac packaging snapshot

This directory contains the built runtime and assets from Windows source commit b7974e4, with the same application logic and UI. It does not replace the repository's separate Mac source branch. Source maps are omitted. Package dependencies remain locked.

The workflow builds on native Apple Silicon and Intel macOS runners, checks the ad-hoc signature, and runs the packaged application smoke test before appending DMG/ZIP files to v0.5.1. No macOS automatic-update manifest is published: the app intentionally enables automatic updates only on Windows.

These Mac packages use ad-hoc signatures. They are not Apple Developer ID signed or notarized. Cloud smoke checks do not replace real-device checks of Gatekeeper, Spaces, menu bar, power management and multiple displays.
