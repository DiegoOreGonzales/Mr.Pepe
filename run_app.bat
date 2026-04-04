@echo off
set DART_EXE=C:\Users\Bacilio\flutter-sdk\bin\cache\dart-sdk\bin\dart.exe
set FLUTTER_TOOL=C:\Users\Bacilio\flutter-sdk\packages\flutter_tools\bin\flutter_tools.dart

echo Iniciando El Brasero en Chrome...
%DART_EXE% %FLUTTER_TOOL% run -d chrome
pause
