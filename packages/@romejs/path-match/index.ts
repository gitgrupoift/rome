/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {PathPatternNode} from './types';
import {parsePattern} from './parse';
import match from './match';
import {PathSegments, AbsoluteFilePath} from '@romejs/path';

export type PathPatterns = Array<PathPatternNode>;
export type PathPattern = PathPatternNode;

export {parsePattern as parsePathPattern};

export {stringifyPathPattern} from './stringify';

export function matchPath(
  path: AbsoluteFilePath,
  patternNode: PathPatternNode,
  cwdSegs?: PathSegments,
): boolean {
  const matches = match(path.getSegments(), patternNode, cwdSegs);

  if (patternNode.negate) {
    return !matches;
  } else {
    return matches;
  }
}

function getGreater(pattern: PathPattern, num: number): number {
  if (pattern.segments.length > num) {
    return pattern.segments.length;
  } else {
    return num;
  }
}

type MatchPatternResult = 'NO_MATCH' | 'IMPLICIT_MATCH' | 'EXPLICIT_MATCH';

export function matchPathPatterns(
  path: AbsoluteFilePath,
  patterns: PathPatterns,
  cwd?: AbsoluteFilePath,
): MatchPatternResult {
  // Bail out if there are no patterns
  if (patterns.length === 0) {
    return 'NO_MATCH';
  }

  let matches = 0;
  let notMatches = 0;

  let hasNegate = false;

  const pathSegments = path.getSegments();
  const cwdSegs = cwd === undefined ? undefined : cwd.getSegments();

  for (const pattern of patterns) {
    // No point in matching an empty pattern, could just contain a comment
    if (pattern.segments.length === 0) {
      continue;
    }

    if (pattern.negate) {
      hasNegate = true;
      if (match(pathSegments, {...pattern, negate: false}, cwdSegs)) {
        notMatches = getGreater(pattern, notMatches);
      }
    } else {
      if (match(pathSegments, pattern, cwdSegs)) {
        matches = getGreater(pattern, matches);
      }
    }
  }

  // If we have a negate pattern, then we need to match more segments than it in order to qualify as a match
  if (hasNegate) {
    if (notMatches > matches) {
      return 'NO_MATCH';
    } else if (matches > notMatches) {
      return 'EXPLICIT_MATCH';
    } else {
      return 'IMPLICIT_MATCH';
    }
  }

  if (matches > 0) {
    return 'EXPLICIT_MATCH';
  }

  return 'NO_MATCH';
}
