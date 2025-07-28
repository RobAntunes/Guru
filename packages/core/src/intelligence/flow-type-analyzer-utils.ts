/**
 * Utility functions for flow and type analysis
 */

import ts from 'typescript';

/**
 * Find a node by name and type in a source file
 */
export function findNodeByName(
  sourceFile: ts.SourceFile,
  name: string,
  nodeType?: ts.SyntaxKind
): ts.Node | undefined {
  let result: ts.Node | undefined;
  
  const visit = (node: ts.Node): void => {
    if (result) return;
    
    // Check various node types
    if (ts.isVariableDeclaration(node) && node.name.getText() === name) {
      result = node;
    } else if (ts.isFunctionDeclaration(node) && node.name?.getText() === name) {
      result = node;
    } else if (ts.isMethodDeclaration(node) && node.name?.getText() === name) {
      result = node;
    } else if (ts.isClassDeclaration(node) && node.name?.getText() === name) {
      result = node;
    } else if (ts.isInterfaceDeclaration(node) && node.name.getText() === name) {
      result = node;
    } else if (ts.isTypeAliasDeclaration(node) && node.name.getText() === name) {
      result = node;
    } else if (ts.isIdentifier(node) && node.text === name && (!nodeType || node.parent.kind === nodeType)) {
      result = node.parent;
    }
    
    ts.forEachChild(node, visit);
  };
  
  visit(sourceFile);
  return result;
}

/**
 * Get the scope node containing a variable
 */
export function getVariableScope(
  sourceFile: ts.SourceFile,
  variableName: string
): ts.Node | undefined {
  let scopeNode: ts.Node | undefined;
  
  const visit = (node: ts.Node): void => {
    if (ts.isVariableDeclaration(node) && node.name.getText() === variableName) {
      // Find the containing function or module
      let parent = node.parent;
      while (parent) {
        if (ts.isFunctionLike(parent) || ts.isSourceFile(parent)) {
          scopeNode = parent;
          break;
        }
        parent = parent.parent;
      }
    }
    
    if (!scopeNode) {
      ts.forEachChild(node, visit);
    }
  };
  
  visit(sourceFile);
  return scopeNode || sourceFile;
}