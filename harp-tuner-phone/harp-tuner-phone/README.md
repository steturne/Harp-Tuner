# HARP TUNER 2000 on a phone

Mixtape 2's harp tuner as a web page for a phone (made for Android Chrome; iPhone Safari should work too, untested). The tuner itself is
Mixtape 2's own: `tools\harp-phone.ps1` copies `tuner.js`, `harp-sound.js`, `harp-tuner.js` and the two pictures in here and makes the
home-screen icons, and `index.html` stands in for the parts of Mixtape it leans on (the sound engine, the files, the microphone).
Run that script whenever the tuner changes in Mixtape 2, then upload again. Live at https://steturne.github.io/Harp-Tuner/harp-tuner-phone/

What it does on a phone:
- sideways: the whole face as in the program. Upright: a tall case of its own, drawn in the photo's metal, with each display, switch and
  button cut out of the photo whole and set into it (ON TARGET across, NOTE beside CENTS and
  TUNE, a finger-wide strip of strings that slides to the string heard and can be slid with a finger, the controls in two rows).
- the phone's own microphone (no Windows helper); it listens only once POWER is flipped, and POWER goes off when the phone shows
  another app or the screen goes off; the screen stays awake while POWER is on
- a little orange lever under each string tuned with its lever up (E, A and B, with the switch on E A B LEVERS UP)
- the phone buzzes when a string comes in tune (Android)
- the tuning log over the whole screen, at a size a phone can read
- a tapped string plays a made-up pluck (the concert harp's recordings, 74 MB, stay on the laptop); on an iPhone it plays from the
  speaker whatever the silent switch says (iOS 17 and later; older ones are told about the switch)
- the saved harps, the settings and the tuning log are kept on the phone (they do not reach the Mixtape folder)
- on the home screen: Android offers it (＋ APP at the top right, or Chrome's menu › Add to Home screen); an iPhone is told how
  (Share › Add to Home Screen), which is also what stops Safari clearing the log. It then opens full screen and works with no signal
  (`sw.js` keeps a copy of every file; a new upload shows the time after next it is opened)

## Putting it on GitHub (all in Edge, nothing to install)
Phones only let a page use the microphone from a secure (https) address, which GitHub Pages gives. Steve's repository is
`steturne/Harp-Tuner` (Pages on, from the main branch), with these files in its `harp-tuner-phone` folder.
1. In PowerShell in `C:\Mixtape`: `powershell -ExecutionPolicy Bypass -File tools\harp-phone.ps1` (copies and icons up to date).
2. On github.com open the repository, click the **harp-tuner-phone** folder, then **Add file** → **Upload files**.
3. Drag in everything inside `C:\Mixtape\harp-tuner-phone` (the files, not the folder; the same names replace the old ones)
   → **Commit changes**. A minute or two later the address above has the new version.
