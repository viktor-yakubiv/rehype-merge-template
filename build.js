import { read } from 'to-vfile'
import { rehype } from 'rehype'
import parser from 'rehype-parse'
import { unified } from 'unified'
import { inspect } from 'unist-util-inspect'
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

const template = ({ 
	template,
	mainElementSelector = ['main', 'body'],
	trim: shouldTrim = false,
} = {}) => {
	let templateTree = template
	return async (documentTree, file) => {
		if (typeof template == 'string') {
			const templateFile = await read(template)
			templateTree = await unified().use(parser).parse(templateFile)
		}

		const tree = clone(templateTree)
		const title = select('title', tree)
		const head = select('head', tree)
		const main = selectFirst(mainElementSelector, tree)

		const trimmer = shouldTrim ? trim : id
		
		const documentTitle = select('title', documentTree)
		const headAppendix = trimmer.call(null, select('head', documentTree)?.children ?? [])
			.filter(node => !isElement(node, 'title'))
		const mainAppendix = trimmer.call(null, select('body', documentTree)?.children ?? [])

		if (documentTitle != null && title != null)
			Object.assign(title, documentTitle)
		else if (documentTitle != null)
			head.children.push(documentTitle)
		head.children.push(...headAppendix)
		main.children.push(...mainAppendix)

		return tree
	}
}

const settings = {
	preferUnquoted: true,
	omitOptionalTags: true,
  collapseEmptyAttributes: true,
}

const file = await rehype()
  .data('settings', settings)
  .use(template, {
    template: 'template.html', 
		mainElementSelector: 'body',
  })
  .process(await read('page.html'))

console.log(String(file))
