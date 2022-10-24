import { gzip, ungzip } from "node-gzip";
import { EtlModel as IEtlModel, EtlModelMetadata } from "@super-protocol/dto-js";
import { EtlModelType } from "@super-protocol/dto-js/build/enum/EtlModel.enum";
import { EtlModelSubtype } from "../types/EtlModel";
import rootLogger from "../logger";
import { ModelPackager } from "../staticModels/ModelPackager";

export class EtlModel {
    public static logger = rootLogger.child({ name: EtlModel.name });

    constructor(private etlModel: IEtlModel) {}

    /**
     * Create instance of EtlModel from Buffer
     *
     * @param data - packed EtlModel
     * @returns instance of EtlModel
     */
    public static async unpack(data: Buffer): Promise<EtlModel> {
        try {
            const etlModel = await ModelPackager.unpack<IEtlModel>(data);

            return new EtlModel(etlModel);
        } catch (error) {
            EtlModel.logger.error("Unable to unpack EtlModel");
            throw error;
        }
    }

    /**
     * Packing EltModel
     *
     * @returns EltModel in binary format
     */
    public async pack(): Promise<Buffer> {
        return ModelPackager.pack(this.etlModel);
    }

    public getType(): EtlModelType {
        return this.etlModel.type;
    }

    public setType(type: EtlModelType): void {
        this.etlModel.type = type;
    }

    public getSubtype(): EtlModelSubtype {
        return this.etlModel.subtype;
    }

    public setSubtype(subtype: EtlModelSubtype | null): void {
        this.etlModel.subtype = subtype;
    }

    public getMetadata(): EtlModelMetadata | void {
        return this.etlModel.metadata;
    }

    public setMetadata(metadata: EtlModelMetadata | undefined): void {
        this.etlModel.metadata = metadata;
    }
}
