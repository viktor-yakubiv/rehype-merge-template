import assert from 'assert'
import { VFile } from 'vfile'
import { rehype } from 'rehype'
import plugin from './index.js'

describe('rehype-merge-documents', () => {
	const process = (file, template, options = {}) => rehype()
		.data('settings', { omitOptionalTags: true }) // easier test writing
		.use(plugin, {
			template: new VFile({
				path: '/tmp/template.html',
				value: template,
			}),
			...options,
		})
		.process(file)
		.then(result => result.value)

	it('replaces template title', async () => {
		const template = `<title>Template</title>`
		const source = `<title>Document</title>`
		const expected = `<title>Document</title>`
		const received = await process(source, template)
		assert.equal(received, expected)
	})

	it('appends title if template misses one', async () => {
		const template = `<link rel="stylesheet" href="styles.css">`
		const source = `<title>Document</title>`
		const expected = `<link rel="stylesheet" href="styles.css"><title>Document</title>`
		const received = await process(source, template)
		assert.equal(received, expected)
	})

	it('keeps template\'s title if document misses one', async () => {
		const template = `<title>Template</title>`
		const source = `<h1>Document</h1>`
		const expected = `<title>Template</title><h1>Document</h1>`
		const received = await process(source, template)
		assert.equal(received, expected)
	})

	it('appends <head>', async () => {
		const template = `<meta charset="utf-8"><title>Template</title>`
		const source = `<link rel="stylesheet" href="local.css"><title>Document</title>`
		const expected = `<meta charset="utf-8"><title>Document</title><link rel="stylesheet" href="local.css">`
		const received = await process(source, template)
		assert.equal(received, expected)
	})

	it('replaces <main> with document body', async () => {
		const template = `<title>Template</title>`
		const source = `<title>Document</title>`
		const expected = `<title>Document</title>`
		const received = await process(source, template)
		assert.equal(received, expected)
	})

	it('finds mainSelector by priority', async () => {
		const template = `<title>Template</title><main><div>Default content</div></main>`
		const source = `<h1>Document</h1>`
		let mainSelector, expected, received

		// no selector passed, finds <main>
		expected = `<title>Template</title><main><h1>Document</h1></main>`
		received = await process(source, template)
		assert.equal(received, expected)

		// a string just finds an element
		mainSelector = 'div'
		expected = `<title>Template</title><main><div><h1>Document</h1></div></main>`
		received = await process(source, template, { mainSelector })
		assert.equal(received, expected)

		// a priority list passed - deeper first
		mainSelector = ['div', 'body']
		received = await process(source, template, { mainSelector })
		assert.equal(received, expected)
		
		// a priority list passed - deeper last
		mainSelector = ['body', 'div']
		expected = `<title>Template</title><h1>Document</h1>`
		received = await process(source, template, { mainSelector })
		assert.equal(received, expected)
	})

	it.skip('uses template\'s doctype', async () => {
		// It appears, that Rehype supports only HTML 5.
		// The following is not relevant.
		//
		// It could throw on incompatible document types.
		// This feature could be implemented with 
		// a e.g. `matchDoctype` or `strictDoctype`, or just `strict` flag
		// but I don't need this feature so far
		// So far, doctype is inherited from the template by implementation.

		const template = `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 strictl//EN"
"http://www.w3.org/TR/html4/strict.dtd">
<html>
	<head><title>Template</title></head>
	<body></body>
</html>`
		const source = `<!doctype html>`
		const expected = template
		const received = await process(source, template)
		assert.equal(received, expected)
	})
})
