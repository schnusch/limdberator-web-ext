# tools
ESBUILD = esbuild
TSC = tsc

# flags
tsflags = \
	--noErrorTruncation \
	--noUnusedParameters \
	--strict \
	--moduleResolution node \
	--target es6 \
	$(TSFLAGS)
esflags = \
	$(ESFLAGS)

all: build/background.js build/content.js build/manifest.json

-include API_CREDENTIALS
sign: all
	web-ext sign -s build --channel unlisted

clean:
	$(RM) -r node_modules build web-ext-artifacts

build/%.js: %.ts scrape.ts node_modules/@types/firefox-webext-browser/index.d.ts node_modules/tata-js/tata.js node_modules/tata-js/tata.d.ts node_modules/tata-js/tata.css
	$(TSC) $(tsflags) --noEmit $(@F:.js=.ts)
	$(ESBUILD) $(esflags) --bundle --platform=browser --outfile=$@ $(@F:.js=.ts)

build/manifest.json: manifest.json
	mkdir -p $(@D)
	cp $(@F) $@

node_modules/@types/firefox-webext-browser/index.d.ts:
	mkdir -p $(@D)
	curl -Lfo $@ https://github.com/DefinitelyTyped/DefinitelyTyped/raw/master/types/firefox-webext-browser/index.d.ts

node_modules/tata-js/tata.d.ts:
	mkdir -p $(@D)
	cp $(@F) $@
node_modules/tata-js/tata.js node_modules/tata-js/tata.css:
	mkdir -p $(@D)
	curl -Lfo $@ https://github.com/xrr2016/tata/raw/master/src/$(@F)
