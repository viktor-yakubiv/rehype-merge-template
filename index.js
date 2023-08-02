import { read } from 'to-vfile'
import { fromHtml } from 'hast-util-from-html'
import { select } from 'hast-util-select'
import { isElement } from 'hast-util-is-element'
import clone from 'lodash.clonedeep'

const id = x => x

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

const template = ({ 
	template,
	mainElementSelector = ['main', 'body'],
	trim: shouldTrim = false,
} = {}) => {
	let templateTree = template
	return async (documentTree) => {
		if (typeof template == 'string') {
			const templateFile = await read(template)
			templateTree = fromHtml(templateFile.value)
		}

		const tree = clone(templateTree)
		const base = select('base', tree)
		const title = select('title', tree)
		const head = select('head', tree)
		const main = selectFirst(mainElementSelector, tree)

		const trimmer = shouldTrim ? trim : id
		
		const documentBase = select('base', documentTree)
		const documentTitle = select('title', documentTree)
		const headAppendix = (select('head', documentTree)?.children ?? [])
			.filter(node => !isElement(node, ['title', 'base']))
		const mainAppendix = select('body', documentTree)?.children ?? []

		if (documentBase != null && base != null) {
			Object.assign(base, documentBase)
		} else if (documentBase != null) {
			// <base> must go before any kind of link so putting is first.
			// If there is a need in a different position, add an empty <base>
			// to the desired position into the template
			head.children.unshift(documentBase)
		}

		if (documentTitle != null && title != null)
			Object.assign(title, documentTitle)
		else if (documentTitle != null)
			head.children.push(documentTitle)
		head.children.push(...trimmer.call(null, headAppendix))
		main.children.push(...trimmer.call(null, mainAppendix))

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
