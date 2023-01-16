import type { VFile } from 'vfile' 
import type { Root } from 'hast'
import type { Plugin } from 'unified'

type Path = string

interface Options {
	template: Path | VFile | Root,
	mainSelector: string | string[],
}

declare const rehypeMergeTemplate: Plugin<[Options?] | Array<void>, Root>

export default rehypeMergeTemplate
export type { Options }
