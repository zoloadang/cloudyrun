SRC_DIR = src
BUILD_DIR = build

JS_ENGINE ?= `which node nodejs`
COMPILER = ${JS_ENGINE} ${BUILD_DIR}/uglify.js --unsafe

DATE=$(shell git log -1 --pretty=format:%ad)

:all
	@@echo "Building .."

.PHONY: all