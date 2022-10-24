import { EtlModelImageSubtype, EtlModelStandardSubtype } from "@super-protocol/dto-js/build/enum/EtlModel.enum";

export type EtlModelSubtype = EtlModelStandardSubtype | EtlModelImageSubtype | null;
