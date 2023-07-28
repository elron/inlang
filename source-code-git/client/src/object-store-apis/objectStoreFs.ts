import type { ObjectStoreFilesystem } from "./types.js"
import type TreeEntry from "./store/trees/TreeEntry.js"
import type { MappedObjectStore, ObjectStats } from "./store/types.js"

import { FilesystemError } from "./errors/FilesystemError.js"

import { getBasename, normalPath, oidToString, stringToOid, modeToType } from "./util.js"

import readTreeEntries from "./store/trees/readTreeEntries.js"

import getOidWithCheckout from "./store/getOidWithCheckout.js"
import updatePathRecursive from "./store/updatePathRecursive.js"

// TODO list:
// - store modes along with oids in a single map instead of 2. No stats object.
// - binary search instead of linear to find and splice entries
// - chmod, rename, rm
// - internal garbage collection (?)
// - modify readObject to take Uint8Arrays instead of strings for oid
// - SHA-256 support, remove hardcoded 20 byte hash lengths

export async function createObjectStoreFs(objectStore: MappedObjectStore) {
	return {
		readFile: async function (
			path: Parameters<ObjectStoreFilesystem["readFile"]>[0],
			options: Parameters<ObjectStoreFilesystem["readFile"]>[1],
		) {
			path = normalPath(path)

			const fileOid: Uint8Array | undefined = await getOidWithCheckout(path, objectStore)
			if (!fileOid) throw new FilesystemError("ENOENT", path, "readFile")

			const fileStats: ObjectStats | undefined = objectStore.fsStats.get(path)

			const fileType = fileStats ? modeToType(fileStats.mode) : ""
			if (fileType === "tree") throw new FilesystemError("EISDIR", path, "readFile")

			const file = (await objectStore.readObject(oidToString(fileOid))).object

			if (!(options?.encoding || typeof options === "string")) return file

			return objectStore.textDecoder.decode(file)
		},

		writeFile: async function (
			path: Parameters<ObjectStoreFilesystem["writeFile"]>[0],
			data: Parameters<ObjectStoreFilesystem["writeFile"]>[1],
			options?: { mode: string },
		) {
			path = normalPath(path)
			options ??= { mode: "100644" }

			if (typeof data === "string") data = objectStore.textEncoder.encode(data)

			const newBlobId = stringToOid((await objectStore.writeObject(data, "blob")) ?? "")

			const newEntry: TreeEntry = {
				pathBuffer: objectStore.textEncoder.encode(getBasename(path) + "\0"),
				modeBuffer: objectStore.textEncoder.encode(options.mode + " "),
				oid: newBlobId,
			}

			await updatePathRecursive(path, newEntry, objectStore)

			objectStore.fsMap.set(path, newBlobId)
			objectStore.fsStats.set(path, { mode: options.mode })
		},

		readdir: async function (path: Parameters<ObjectStoreFilesystem["readdir"]>[0]) {
			path = normalPath(path)

			const dirOid: Uint8Array | undefined = await getOidWithCheckout(path, objectStore)
			if (!dirOid) throw new FilesystemError("ENOENT", path, "readdir")

			const dirStats: ObjectStats | undefined = objectStore.fsStats.get(path)

			const dirType = dirStats ? modeToType(dirStats.mode) : ""
			if (dirType === "blob") throw new FilesystemError("ENOTDIR", path, "readdir")

			const tree = (await objectStore.readObject(oidToString(dirOid))).object

			return [...readTreeEntries(tree)].map((x) => objectStore.textDecoder.decode(x.pathBuffer))
		},
		mkdir: async function (path: Parameters<ObjectStoreFilesystem["mkdir"]>[0]) {
			const newTreeId = stringToOid((await objectStore.writeObject(new Uint8Array(), "tree")) ?? "")
			const newEntry: TreeEntry = {
				pathBuffer: objectStore.textEncoder.encode(getBasename(path) + "\0"),
				modeBuffer: objectStore.textEncoder.encode("40000" + " "),
				oid: newTreeId,
			}

			await updatePathRecursive(path, newEntry, objectStore)

			objectStore.fsMap.set(path, newTreeId)
			objectStore.fsStats.set(path, { mode: "40000" })
		},
		getRootOid: () => oidToString(objectStore.fsMap.get("/") ?? new Uint8Array()),
	}
}
