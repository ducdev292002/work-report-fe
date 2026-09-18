// Flattens the nested org tree into a list with a `depth` for indentation,
// used to populate <select> dropdowns (assign employee/document to a unit).
export function flattenOrgTree(nodes, depth = 0, acc = []) {
  for (const node of nodes) {
    acc.push({ id: node._id, name: node.name, type: node.type, depth });
    if (node.children?.length) flattenOrgTree(node.children, depth + 1, acc);
  }
  return acc;
}

// The org roots a given user is allowed to see in scoped pages (reports,
// timeline, employees filters): admin sees everything, a manager/employee
// only ever sees their own OrgUnit and whatever is nested under it.
export function getVisibleRoots(tree, user) {
  if (user.role === 'admin') return tree;
  if (!user.orgUnit) return [];
  const node = findUnitById(tree, user.orgUnit);
  return node ? [node] : [];
}

// All projects nested anywhere under the given roots (recursively) — used
// to build a flat "assignable projects" list for a scope, regardless of how
// deep a project sits in the department/team hierarchy.
export function collectProjects(nodes) {
  const acc = [];
  (function walk(list) {
    for (const node of list) {
      node.projects?.forEach((p) => acc.push(p));
      if (node.children?.length) walk(node.children);
    }
  })(nodes);
  return acc;
}

export function findUnitById(nodes, id) {
  for (const node of nodes) {
    if (node._id === id) return node;
    if (node.children?.length) {
      const found = findUnitById(node.children, id);
      if (found) return found;
    }
  }
  return null;
}
