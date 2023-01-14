import parser from 'rehype-parse'
import { VFile } from 'vfile'
import { read } from 'to-vfile'
import { unified } from 'unified'
import { select } from 'hast-util-select'
import clone from 'lodash.clonedeep'
import { isElement } from 'hast-util-is-element'

const selectFirst = (selector, tree) =>
	Array.isArray(selector)
		? selector.reduce((chosen, s) => chosen ?? select(s, tree), null)
		: select(selector, tree)

const trim = nodeList => {
  const test = ({ type, value }) => type === 'element' || !/^\s*$/gi.test(value)
  const start = nodeList.findIndex(test)
  // findIndexLast is missing
  const end = (nodeList.length - 1) - [...nodeList].reverse().findIndex(test)
  return nodeList.slice(start, end + 1)
}

const id = x => x

const readTemplate = async value => {
	// template is a file path
	if (typeof value == 'string') {
		return readTemplate(await read(value))
	}

	// template is a file already
	if (value instanceof VFile) {
		return unified().use(parser).parse(value)
	}

	// template is a tree already
	if (isElement(value)) {
		return value
	}

	throw new Error(`options.template has wrong type. Supported types are file path, VFile or a Rehype Root.`)
}

const attach = ({ 
	template,
	mainElementSelector = ['main', 'body'],
	trim: shouldTrim = false,
} = {}) => {
	let templateTree

	const transform = async (documentTree, file) => {
		if (templateTree == null) {
			templateTree = await readTemplate(template)
		}

		const tree = clone(templateTree)
		const title = select('title', tree)
		const head = select('head', tree)
		const main = selectFirst(mainElementSelector, tree)

		const trimmer = shouldTrim ? trim : id
		
		const documentTitle = select('title', documentTree)
		const headContents = (select('head', documentTree)?.children ?? [])
			.filter(node => !isElement(node, 'title'))
		const mainContents = select('body', documentTree)?.children ?? []

		// <title> it can appear only once in a document
		// if there is any, it must be replaced
		if (documentTitle != null && title != null) {
			Object.assign(title, documentTitle)
		} else if (documentTitle != null) {
			head.children.push(documentTitle)
		}

		head.children.push(...trimmer.call(null, headContents))
		main.children.push(...trimmer.call(null, mainContents))

		return tree
	}

	return transform
}

export default attach
