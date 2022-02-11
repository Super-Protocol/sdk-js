// Order of keys and type conversion functions for this object in blockchain contract
export const EpochStructure = {
    startDate: Number,
    endDate: Number,
    reward: Number,
    benchmark: Number,
    reparation: Number,
    reparationBenchmark: Number,
};
export type Epoch = {
    startDate: number;
    endDate: number;
    reward: number;
    benchmark: number;
    reparation: number;
    reparationBenchmark: number;
};
export enum TcbStatus {
    Inited = "0",
    Completed = "1",
    Banned = "2",
}