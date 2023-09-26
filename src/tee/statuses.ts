export enum QEIdentityStatuses {
    UpToDate = 'UpToDate',
    OutOfDate = 'OutOfDate',
    Revoked = 'Revoked',
}

export enum TCBStatuses {
    UpToDate = 'UpToDate',
    OutOfDate = 'OutOfDate',
    Revoked = 'Revoked',
    ConfigurationNeeded = 'ConfigurationNeeded',
    ConfigurationAndSWHardeningNeeded = 'ConfigurationAndSWHardeningNeeded',
    SWHardeningNeeded = 'SWHardeningNeeded',
    OutOfDateConfigurationNeeded = 'OutOfDateConfigurationNeeded',
}

export enum QuoteValidationStatuses {
    UpToDate = 'UpTodate',
    NeedSecurityPatch = 'NeedSecurityPatch',
    NeedSoftwareUpdate = 'NeedSoftwareUpdate',
    Error = 'Error',
}
