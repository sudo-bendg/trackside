#!/bin/bash

# build requires java version 17
JAVA_VERSION_17=$(java --version | grep '17.' | wc -l) 
if [ "$JAVA_VERSION_17" -eq 0 ]; then
  echo "Error: Java version 17 is required to build the APK."
  exit 1
fi

mkdir -p build 2> /dev/null
mv ./build* ./build

npm run icon:png
eas build --platform android --local --profile production