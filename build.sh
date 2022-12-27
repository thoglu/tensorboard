#!/bin/bash
export USE_BAZEL_VERSION=5.4.0
mkdir -p /tmp/tb
./bazelisk-linux-amd64 run //tensorboard/pip_package:extract_pip_package -- /tmp/tb
pip install --upgrade /tmp/tb/tensorboard*py3*.whl