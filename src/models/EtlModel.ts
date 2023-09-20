import * as protobuf from 'protobufjs';
import { EtlModel as IEtlModel, EtlModelMetadata } from '@super-protocol/dto-js';
import { EtlModelType } from '@super-protocol/dto-js/build/enum/EtlModel.enum';
import { EtlModelSubtype } from '../types/EtlModel';
import rootLogger from '../logger';
import { ModelPackager } from '../staticModels/ModelPackager';
import { ResourceContentType } from '@super-protocol/dto-js/build/enum/ResourceContentType.enum';
import { getResourceLoader } from '../utils/resourceLoaders';

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
            EtlModel.logger.error('Unable to unpack EtlModel');
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

    public async downloadMetadata(): Promise<Record<string, unknown>> {
        const { metadata } = this.etlModel;
        if (!metadata?.resource) {
            throw new Error('Resource is not present int he EtlModel');
        }

        const ResourceLoader = getResourceLoader(metadata.resource.type);

        try {
            const bytes = await new ResourceLoader().download(metadata.resource);
            if (bytes.byteLength === 0) {
                throw new Error('Resource is empty');
            }

            const stringified = bytes.toString();
            switch (metadata.resourceContentType) {
                case ResourceContentType.JSON:
                    return this.parseJsonResource(stringified);

                case ResourceContentType.PROTOBUF:
                    return this.parseProtobufResource(stringified);

                default:
                    throw new Error(
                        `Resource content type ${metadata.resourceContentType} is not supported`,
                    );
            }
        } catch (error) {
            throw new Error(
                `Error during download and parsing resource: ${(error as Error).message}`,
            );
        }
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

    private parseJsonResource(data: string): Record<string, unknown> {
        try {
            return JSON.parse(data);
        } catch (error) {
            throw new Error('JSON data in incorrect');
        }
    }

    private parseProtobufResource(data: string): Record<string, unknown> {
        try {
            return protobuf.parse(data).root.toJSON().nested as Record<string, unknown>;
        } catch (error) {
            throw new Error('Protobuf message is incorrect');
        }
    }
}
