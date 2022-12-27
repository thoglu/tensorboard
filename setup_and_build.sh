#!/bin/bash
export USE_BAZEL_VERSION=5.4.0
wget https://github.com/bazelbuild/bazelisk/releases/download/v1.15.0/bazelisk-linux-amd64
chmod +x bazelisk-linux-amd64
## only works under linux and amd architecture
mkdir -p /tmp/tb
./bazelisk-linux-amd64 run //tensorboard/pip_package:extract_pip_package -- /tmp/tb
mkdir /tmp/tb
pip install --upgrade /tmp/tb/tensorboard*py3*.whl