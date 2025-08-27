// Logical board graph for movement and combat direction rules
import { isValidPosition, findById } from "../utils/gridUtils";

export type Orientation = "Up" | "Down" | "Left" | "Right";
export type Direction = "Up" | "Down" | "UpLeft" | "UpRight" | "DownLeft" | "DownRight";
export type AttackAttribute = "sun" | "moon" | "neutral";

export interface Tile {
    id: number;
    row: number;
    col: number;
    orient: Orientation;
}

export interface NeighborWithDir {
    id: number;
    dir: Direction;
}

export interface BoardGraph {
    rows: number;
    cols: number;
    tiles: Tile[];
    idToRC: Map<number, { row: number; col: number }>;
    rcToId: (row: number, col: number) => number | null;
    edges: Map<number, number[]>;
    edgesByDir: Map<number, NeighborWithDir[]>;
}

export interface NeighborOptions {
    allowVertexJump?: boolean;
}

// Special tile mappings with virtual coordinates and correct orientations
interface SpecialTileMapping {
    id: number;
    virtualCoords: Array<{ row: number; col: number }>;
    orient: Orientation;
    // Hardcoded connections for special tiles
    edgeConnections: Record<Direction, number[]>;
    vertexConnections: number[];
}

const SPECIAL_TILE_MAPPINGS: SpecialTileMapping[] = [
    // 30번: 2.5행 좌측 모서리 → (1, -1), (2, -1), 우측을 바라봄 (Right)
    {
        id: 30,
        virtualCoords: [
            { row: 1, col: -1 },
            { row: 2, col: -1 },
        ],
        orient: "Right",
        edgeConnections: {
            Up: [],
            Down: [],
            UpLeft: [],
            UpRight: [5],
            DownLeft: [],
            DownRight: [10],
        },
        vertexConnections: [0, 5, 6, 10, 11, 15, 31],
    },
    // 31번: 4.5행 좌측 모서리 → (3, -1), (4, -1), 우측을 바라봄 (Right)
    {
        id: 31,
        virtualCoords: [
            { row: 3, col: -1 },
            { row: 4, col: -1 },
        ],
        orient: "Right",
        edgeConnections: {
            Up: [],
            Down: [],
            UpLeft: [],
            UpRight: [15],
            DownLeft: [],
            DownRight: [20],
        },
        vertexConnections: [10, 15, 16, 20, 21, 25, 30],
    },
    // 32번: 2.5행 우측 모서리 → (1, 5), (2, 5), 좌측을 바라봄 (Left)
    {
        id: 32,
        virtualCoords: [
            { row: 1, col: 5 },
            { row: 2, col: 5 },
        ],
        orient: "Left",
        edgeConnections: {
            Up: [],
            Down: [],
            UpLeft: [9],
            UpRight: [],
            DownLeft: [14],
            DownRight: [],
        },
        vertexConnections: [4, 8, 9, 13, 14, 19, 33],
    },
    // 33번: 4.5행 우측 모서리 → (3, 5), (4, 5), 좌측을 바라봄 (Left)
    {
        id: 33,
        virtualCoords: [
            { row: 3, col: 5 },
            { row: 4, col: 5 },
        ],
        orient: "Left",
        edgeConnections: {
            Up: [],
            Down: [],
            UpLeft: [19],
            UpRight: [],
            DownLeft: [24],
            DownRight: [],
        },
        vertexConnections: [14, 18, 23, 24, 29, 32],
    },
];

// Vertex-contact neighbor offsets (orientation-specific patterns)
const vertexOffsetsUp = [
    { dr: -1, dc: -1 },
    { dr: -1, dc: 0 },
    { dr: -1, dc: 1 },
    { dr: 0, dc: -2 },
    { dr: 0, dc: -1 },
    { dr: 0, dc: 1 },
    { dr: 0, dc: 2 },
    { dr: 1, dc: -2 },
    { dr: 1, dc: -1 },
    { dr: 1, dc: 0 },
    { dr: 1, dc: 1 },
    { dr: 1, dc: 2 },
];

const vertexOffsetsDown = [
    { dr: -1, dc: -2 },
    { dr: -1, dc: -1 },
    { dr: -1, dc: 0 },
    { dr: -1, dc: 1 },
    { dr: -1, dc: 2 },
    { dr: 0, dc: -2 },
    { dr: 0, dc: -1 },
    { dr: 0, dc: 1 },
    { dr: 0, dc: 2 },
    { dr: 1, dc: -1 },
    { dr: 1, dc: 0 },
    { dr: 1, dc: 1 },
];

// Lazy calculation function for vertex edges (including special tiles)
function calculateVertexEdges(tile: Tile, rows: number, cols: number, rcToId: (row: number, col: number) => number | null): number[] {
    // Check if this is a special tile
    const specialMapping = SPECIAL_TILE_MAPPINGS.find((m) => m.id === tile.id);
    if (specialMapping) {
        // Special tiles use hardcoded vertex connections
        return specialMapping.vertexConnections;
    }

    // Regular tiles use standard vertex offsets
    const vertexOffsets = tile.orient === "Up" ? vertexOffsetsUp : tile.orient === "Down" ? vertexOffsetsDown : [];
    if (vertexOffsets.length === 0) return [];

    const inBounds = (r: number, c: number) => isValidPosition(r, c, rows, cols);

    const vertexNeighbors: number[] = [];
    for (const { dr, dc } of vertexOffsets) {
        const r = tile.row + dr;
        const c = tile.col + dc;

        if (inBounds(r, c)) {
            const nid = rcToId(r, c);
            if (nid !== null) {
                vertexNeighbors.push(nid);
            }
        }
    }

    // Add special tile connections for regular tiles
    for (const mapping of SPECIAL_TILE_MAPPINGS) {
        for (const coord of mapping.virtualCoords) {
            // Check if this tile connects to the special tile via vertex contact
            const dr = coord.row - tile.row;
            const dc = coord.col - tile.col;

            // Check if the offset matches any vertex offset pattern
            const isVertexContact = vertexOffsets.some((offset) => offset.dr === dr && offset.dc === dc);

            if (isVertexContact) {
                vertexNeighbors.push(mapping.id);
            }
        }
    }

    return vertexNeighbors;
}

export function buildBoardGraph(rows = 6, cols = 5): BoardGraph {
    const tiles: Tile[] = [];
    const idToRC = new Map<number, { row: number; col: number }>();
    const rcToIdMap = new Map<string, number>();

    const rcKey = (r: number, c: number) => `${r},${c}`;
    const rcToId = (r: number, c: number) => rcToIdMap.get(rcKey(r, c)) ?? null;

    // Assign ids, orientation alternates by id parity (even=Up, odd=Down)
    for (let i = 0; i < rows * cols; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const orient: Orientation = i % 2 === 0 ? "Up" : "Down";
        tiles.push({ id: i, row, col, orient });
        idToRC.set(i, { row, col });
        rcToIdMap.set(rcKey(row, col), i);
    }

    // Add special tiles
    for (const mapping of SPECIAL_TILE_MAPPINGS) {
        // Use the first virtual coordinate as the "primary" position for the tile
        const primaryCoord = mapping.virtualCoords[0];
        tiles.push({
            id: mapping.id,
            row: primaryCoord.row,
            col: primaryCoord.col,
            orient: mapping.orient,
        });
        idToRC.set(mapping.id, { row: primaryCoord.row, col: primaryCoord.col });
    }

    const inBounds = (r: number, c: number) => isValidPosition(r, c, rows, cols);

    // Side-contact neighbor offsets
    const sideOffsetsUp = [
        { dr: +1, dc: 0 }, // Down
        { dr: 0, dc: -1 }, // UpLeft (for Up orient)
        { dr: 0, dc: +1 }, // UpRight (for Up orient)
    ];
    const sideOffsetsDown = [
        { dr: -1, dc: 0 }, // Up
        { dr: 0, dc: -1 }, // DownLeft (for Down orient)
        { dr: 0, dc: +1 }, // DownRight (for Down orient)
    ];

    const edges = new Map<number, number[]>();
    const edgesByDir = new Map<number, NeighborWithDir[]>();

    for (const t of tiles) {
        const sideNeighbors: number[] = [];
        const sideNeighborsWithDir: NeighborWithDir[] = [];

        if (t.orient === "Up" || t.orient === "Down") {
            // Regular tiles use standard side offsets
            const sideDirs = t.orient === "Up" ? sideOffsetsUp : sideOffsetsDown;

            for (const { dr, dc } of sideDirs) {
                const r = t.row + dr;
                const c = t.col + dc;
                if (inBounds(r, c)) {
                    const nid = rcToId(r, c);
                    if (nid !== null) {
                        sideNeighbors.push(nid);
                        sideNeighborsWithDir.push({ id: nid, dir: resolveDirection(t.orient, dr, dc) });
                    }
                }
            }

            // Add special tile connections for regular tiles
            for (const mapping of SPECIAL_TILE_MAPPINGS) {
                for (const coord of mapping.virtualCoords) {
                    const dr = coord.row - t.row;
                    const dc = coord.col - t.col;

                    // Check if this tile connects to the special tile via edge contact
                    const isEdgeContact = sideDirs.some((offset) => offset.dr === dr && offset.dc === dc);

                    if (isEdgeContact) {
                        sideNeighbors.push(mapping.id);
                        sideNeighborsWithDir.push({
                            id: mapping.id,
                            dir: resolveDirection(t.orient, dr, dc),
                        });
                    }
                }
            }
        } else {
            // Special tiles use their hardcoded connections
            const mapping = SPECIAL_TILE_MAPPINGS.find((m) => m.id === t.id);
            if (mapping) {
                // Add edge connections from hardcoded data
                for (const [dir, neighborIds] of Object.entries(mapping.edgeConnections)) {
                    for (const neighborId of neighborIds) {
                        sideNeighbors.push(neighborId);
                        sideNeighborsWithDir.push({ id: neighborId, dir: dir as Direction });
                    }
                }
            }
        }

        edges.set(t.id, sideNeighbors);
        edgesByDir.set(t.id, sideNeighborsWithDir);
    }

    return {
        rows,
        cols,
        tiles,
        idToRC,
        rcToId,
        edges,
        edgesByDir,
    };
}

export function getNeighbors(g: BoardGraph, id: number, opt: NeighborOptions = {}): number[] {
    const base = g.edges.get(id) ?? [];
    if (!opt.allowVertexJump) return base;

    // Calculate vertex edges on-demand
    const tile = findById(g.tiles, id);
    if (!tile) return base;

    const extra = calculateVertexEdges(tile, g.rows, g.cols, g.rcToId);
    const set = new Set<number>([...base, ...extra]);
    return [...set];
}

export function getNeighborsWithDir(g: BoardGraph, id: number, opt: NeighborOptions = {}): NeighborWithDir[] {
    const base = g.edgesByDir.get(id) ?? [];
    if (!opt.allowVertexJump) return base;

    // Calculate vertex edges on-demand and convert to NeighborWithDir format
    const tile = findById(g.tiles, id);
    if (!tile) return base;

    const extra = calculateVertexEdges(tile, g.rows, g.cols, g.rcToId);
    const extraWithDir: NeighborWithDir[] = extra.map((id) => ({ id, dir: "neutral" as Direction }));

    const combo = [...base, ...extraWithDir];
    // Deduplicate by id, keep first occurrence's direction
    const seen = new Set<number>();
    const result: NeighborWithDir[] = [];
    for (const n of combo) {
        if (!seen.has(n.id)) {
            seen.add(n.id);
            result.push(n);
        }
    }
    return result;
}

export function directionAttackAttribute(dir: Direction): AttackAttribute {
    if (dir === "UpRight" || dir === "DownLeft") return "sun";
    if (dir === "UpLeft" || dir === "DownRight") return "moon";
    return "neutral";
}

export function resolveDirection(orient: Orientation, dr: number, dc: number): Direction {
    // Vertical moves
    if (dr === -1 && dc === 0) return "Up";
    if (dr === 1 && dc === 0) return "Down";

    // Horizontal (column) offsets map to diagonals; interpretation depends on orientation
    if (dr === 0 && dc === -1) return orient === "Up" ? "UpLeft" : "DownLeft";
    if (dr === 0 && dc === 1) return orient === "Up" ? "UpRight" : "DownRight";

    // Diagonal offsets (vertex contact)
    if (dr === 1 && dc === -1) return "DownLeft";
    if (dr === 1 && dc === 1) return "DownRight";
    if (dr === -1 && dc === -1) return "UpLeft";
    if (dr === -1 && dc === 1) return "UpRight";

    // Fallback, should not happen with defined offsets
    return "Up";
}

export function tileIdToRC(g: BoardGraph, id: number): { row: number; col: number } | null {
    return g.idToRC.get(id) ?? null;
}
