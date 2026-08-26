# _template

Not a session. The empty shape of one.

```
mkdir -p sessions/<slug>
cp -R sessions/_template/. sessions/<slug>/
```

Copy it during `workflows/01-sources.md`, after GATE 2 and once there is a real
`sources.md` to write — not before. Delete the files the session has not
reached yet; an empty `results.md` on a session still picking sources is
noise. The `/.` merges into a tools-only folder created by the probe instead of
navigating the skeleton underneath it. Leading `_` means "skip me" when listing
sessions.
