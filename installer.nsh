!macro customInstall
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Explorer\SessionInfo\1\ApplicationViewImmersiveContext" "DoThat" "1"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Explorer\SessionInfo\1\ApplicationViewImmersiveContext" "DoThat.exe" "1"
!macroend
 
!macro customUnInstall
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Explorer\SessionInfo\1\ApplicationViewImmersiveContext" "DoThat"
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Explorer\SessionInfo\1\ApplicationViewImmersiveContext" "DoThat.exe"
!macroend 