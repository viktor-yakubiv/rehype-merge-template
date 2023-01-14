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
				contents: template,
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

	it('appends title if template misses one', async () => {})
	it('keeps template\'s title if document misses one', async () => {})
	it('appends <head>', async () => {})
	it('replaces <main> with document body', async () => {})
	it('finds mainSelector by priority', async () => {})
})
