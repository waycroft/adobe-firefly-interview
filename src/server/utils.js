import { nanoid } from 'nanoid'
import path from 'node:path'

/**
 * Appends an arbitrary string to a valid object key used for block storage.
 * (Useful because this string needs to be inserted AFTER all folders, but BEFORE all file extensions.)
 * @param {string} objectKey
 * @param {string} stringToAppend - Make sure to include any desired delimiter
 * @returns {string}
 */
export function appendToFilename(objectKey, stringToAppend) {
  // e.g. images/musicians/stevie_wonder.jpg.bak -> images/musicians/stevie_wonder_123.jpg.bak
  const parsedPath = path.parse(objectKey)
  const newName = parsedPath.name + stringToAppend
  parsedPath.name = newName
  delete parsedPath.base // If base is present, it will override `name` and `ext` when running path.format—so we "remove" it.
  return path.format(parsedPath)
}

/**
 * Takes an object key for a storage bucket (i.e. a file path) and appends a unique id to the filename.
 */
export function createUniqueObjectKey(objectKey, size = 9) {
  return appendToFilename(objectKey, `_${nanoid(size)}`)
}
