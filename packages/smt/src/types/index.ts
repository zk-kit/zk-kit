export type Node = string | bigint
export type Key = Node
export type Value = Node
export type EntryMark = Node

export type Entry = [Key, Value, EntryMark]
export type InternalChildNodes = [Node, Node]
export type LeafChildNodes = Entry
export type ChildNodes = InternalChildNodes | LeafChildNodes
export type Siblings = Node[]

export type HashFunction = (childNodes: ChildNodes | [Key] | [Key, Value, EntryMark]) => Node

export interface EntryResponse {
    entry: LeafChildNodes | [Key]
    matchingEntry?: LeafChildNodes
    siblings: Siblings
}

export interface MerkleProof extends EntryResponse {
    root: Node
    membership: boolean
}
