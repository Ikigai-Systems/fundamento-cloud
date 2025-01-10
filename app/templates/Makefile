MARKDOWN_FILES := $(wildcard *.markdown)
BLOCKNOTE_FILES := $(MARKDOWN_FILES:.markdown=.blocknote.json)
YJS_FILES := $(MARKDOWN_FILES:.markdown=.yjs)
BLOCKNOTE_CONVERTER := node ../../micro-services/blocknote-converter/build/blocknoteConverter.js

all: $(BLOCKNOTE_FILES) $(YJS_FILES)

build_converter:
	cd ../../micro-services/blocknote-converter && npm install && npm run converter:build

%.blocknote.json: %.markdown | build_converter
	$(BLOCKNOTE_CONVERTER) convert-markdown-to-blocks -i $< -o $@

%.yjs: %.blocknote.json | build_converter
	$(BLOCKNOTE_CONVERTER) convert-blocks-to-yjs -i $< -o $@

clean:
	rm -f $(BLOCKNOTE_FILES) $(YJS_FILES)

.PHONY: all build_converter clean