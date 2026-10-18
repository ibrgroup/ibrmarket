/**
 * Иерархия категорий (parentId): обход потомков для фильтрации товаров.
 * Товары обычно привязаны к листу дерева; при выборе родителя нужны все его id.
 */

/**
 * @param {Array<{ _id: unknown, parentId?: unknown }>} categoriesLean
 * @returns {Map<string, string[]>} ключ — строковый parentId; корневые дети под '__root__'
 */
export function buildCategoryChildrenByParentId(categoriesLean) {
	const map = new Map();
	for (const c of categoriesLean) {
		const pid = c.parentId != null ? String(c.parentId) : '__root__';
		if (!map.has(pid)) map.set(pid, []);
		map.get(pid).push(String(c._id));
	}
	return map;
}

/**
 * @param {string} rootIdStr
 * @param {Map<string, string[]>} childrenByParent
 * @returns {Set<string>}
 */
export function collectDescendantCategoryIds(rootIdStr, childrenByParent) {
	const out = new Set([rootIdStr]);
	const stack = [rootIdStr];
	while (stack.length) {
		const id = stack.pop();
		const kids = childrenByParent.get(id);
		if (!kids) continue;
		for (const k of kids) {
			if (!out.has(k)) {
				out.add(k);
				stack.push(k);
			}
		}
	}
	return out;
}
