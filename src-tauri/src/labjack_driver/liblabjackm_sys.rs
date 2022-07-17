/*

LJM_OpenS
LJM_Close

LJM_eReadName
LJM_eWriteName

LJM_eStreamStart
LJM_eStreamStop
LJM_NameToAddress
LJM_eStreamRead

*/

extern "C" {
    #[doc = " Name: LJM_OpenS"]
    #[doc = " Desc: Opens a LabJack device."]
    #[doc = " Para: DeviceType, a string containing the type of the device to be connected,"]
    #[doc = "           optionally prepended by \"LJM_dt\". Possible values include \"ANY\","]
    #[doc = "           \"T4\", \"T7\", and \"DIGIT\"."]
    #[doc = "       ConnectionType, a string containing the type of the connection desired,"]
    #[doc = "           optionally prepended by \"LJM_ct\". Possible values include \"ANY\","]
    #[doc = "           \"USB\", \"TCP\", \"ETHERNET\", and \"WIFI\"."]
    #[doc = "       Identifier, a string identifying the device to be connected or"]
    #[doc = "           \"LJM_idANY\"/\"ANY\". This can be a serial number, IP address, or"]
    #[doc = "           device name. Device names may not contain periods."]
    #[doc = "       Handle, the new handle that represents a device connection upon success"]
    #[doc = " Retr: LJME_NOERROR, if a device was successfully opened."]
    #[doc = "       LJME_ATTR_LOAD_COMM_FAILURE, if a device was found, but there was a"]
    #[doc = "           communication failure."]
    #[doc = " Note: Input parameters are not case-sensitive."]
    #[doc = " Note: Empty strings passed to DeviceType, ConnectionType, or Identifier"]
    #[doc = "           indicate the same thing as LJM_dtANY, LJM_ctANY, or LJM_idANY,"]
    #[doc = "           respectively."]
    pub fn LJM_OpenS(
        DeviceType: *const ::std::os::raw::c_char,
        ConnectionType: *const ::std::os::raw::c_char,
        Identifier: *const ::std::os::raw::c_char,
        Handle: *mut ::std::os::raw::c_int,
    ) -> ::std::os::raw::c_int;
}
extern "C" {
    #[doc = " Name: LJM_GetHandleInfo"]
    #[doc = " Desc: Takes a device handle as input and returns details about that device."]
    #[doc = " Para: Handle, a valid handle to an open device."]
    #[doc = "       DeviceType, the output device type corresponding to a constant such as"]
    #[doc = "           LJM_dtT7."]
    #[doc = "       ConnectionType, the output device type corresponding to a constant"]
    #[doc = "           such as LJM_ctUSB."]
    #[doc = "       SerialNumber, the output serial number of the device."]
    #[doc = "       IPAddress, the output integer representation of the device's IP"]
    #[doc = "           address when ConnectionType is TCP-based. If ConnectionType is not"]
    #[doc = "           TCP-based, this will be LJM_NO_IP_ADDRESS. Note that this can be"]
    #[doc = "           converted to a human-readable string with the LJM_NumberToIP"]
    #[doc = "           function."]
    #[doc = "       Port, the output port if the device connection is TCP-based, or the pipe"]
    #[doc = "           if the device connection is USB-based."]
    #[doc = "       MaxBytesPerMB, the maximum packet size in number of bytes that can be"]
    #[doc = "           sent to or received from this device. Note that this can change"]
    #[doc = "           depending on connection type and device type."]
    #[doc = " Note: This function returns device information loaded during an open call"]
    #[doc = "       and therefore does not initiate communications with the device. In"]
    #[doc = "       other words, it is fast but will not represent changes to serial"]
    #[doc = "       number or IP address since the device was opened."]
    #[doc = " Warn: This function ignores null pointers"]
    #[allow(dead_code)]
    pub fn LJM_GetHandleInfo(
        Handle: ::std::os::raw::c_int,
        DeviceType: *mut ::std::os::raw::c_int,
        ConnectionType: *mut ::std::os::raw::c_int,
        SerialNumber: *mut ::std::os::raw::c_int,
        IPAddress: *mut ::std::os::raw::c_int,
        Port: *mut ::std::os::raw::c_int,
        MaxBytesPerMB: *mut ::std::os::raw::c_int,
    ) -> ::std::os::raw::c_int;
}
extern "C" {
    #[doc = " Name: LJM_Close"]
    #[doc = " Desc: Closes the connection to the device."]
    #[doc = " Para: Handle, a valid handle to an open device."]
    pub fn LJM_Close(Handle: ::std::os::raw::c_int) -> ::std::os::raw::c_int;
}
extern "C" {
    #[doc = " Name: LJM_eReadAddress, LJM_eReadName"]
    #[doc = "       LJM_eWriteAddress, LJM_eWriteName"]
    #[doc = " Desc: Creates and sends a Modbus operation, then receives and parses the"]
    #[doc = "       response."]
    #[doc = " Para: Handle, a valid handle to an open device"]
    #[doc = "       (Address), an address to read/write"]
    #[doc = "       (Type), the type corresponding to Address"]
    #[doc = "       (Name), a name to read/write"]
    #[doc = "       Value, a value to write or read"]
    #[doc = " Note: These functions may take liberties in deciding what kind of Modbus"]
    #[doc = "       operation to create. For more control of what kind of packets may be"]
    #[doc = "       sent/received, please see the LJM_WriteLibraryConfigS function."]
    pub fn LJM_eWriteName(
        Handle: ::std::os::raw::c_int,
        Name: *const ::std::os::raw::c_char,
        Value: f64,
    ) -> ::std::os::raw::c_int;
}
extern "C" {
    pub fn LJM_eReadName(
        Handle: ::std::os::raw::c_int,
        Name: *const ::std::os::raw::c_char,
        Value: *mut f64,
    ) -> ::std::os::raw::c_int;
}
extern "C" {
    #[doc = " Name: LJM_eStreamStart"]
    #[doc = " Desc: Initializes a stream object and begins streaming. This includes"]
    #[doc = "       creating a buffer in LJM that collects data from the device."]
    #[doc = " Para: Handle, a valid handle to an open device."]
    #[doc = "       ScansPerRead, Number of scans returned by each call to the"]
    #[doc = "           LJM_eStreamRead function. This is not tied to the maximum packet"]
    #[doc = "           size for the device."]
    #[doc = "       NumAddresses, The size of aScanList. The number of addresses to scan."]
    #[doc = "       aScanList, Array of Modbus addresses to collect samples from, per scan."]
    #[doc = "       ScanRate, input/output pointer. Sets the desired number of scans per"]
    #[doc = "           second. Upon successful return of this function, gets updated to"]
    #[doc = "           the actual scan rate that the device will scan at."]
    #[doc = " Note: Address configuration such as range, resolution, and differential"]
    #[doc = "       voltages are handled by writing to the device."]
    #[doc = " Note: Check your device's documentation for which addresses are valid for"]
    #[doc = "       aScanList."]
    pub fn LJM_eStreamStart(
        Handle: ::std::os::raw::c_int,
        ScansPerRead: ::std::os::raw::c_int,
        NumAddresses: ::std::os::raw::c_int,
        aScanList: *const ::std::os::raw::c_int,
        ScanRate: *mut f64,
    ) -> ::std::os::raw::c_int;
}
extern "C" {
    #[doc = " Name: LJM_eStreamRead"]
    #[doc = " Desc: Returns data from an initialized and running LJM stream buffer. Waits"]
    #[doc = "       for data to become available, if necessary."]
    #[doc = " Para: Handle, a valid handle to an open device."]
    #[doc = "       aData, Output data array. Returns all addresses interleaved. Must be"]
    #[doc = "           large enough to hold (ScansPerRead * NumAddresses) values."]
    #[doc = "           ScansPerRead and NumAddresses are set when stream is set up with"]
    #[doc = "           LJM_eStreamStart. The data returned is removed from the LJM stream"]
    #[doc = "           buffer."]
    #[doc = "       DeviceScanBacklog, The number of scans left in the device buffer, as"]
    #[doc = "           measured from when data was last collected from the device. This"]
    #[doc = "           should usually be near zero and not growing for healthy streams."]
    #[doc = "       LJMScanBacklog, The number of scans left in the LJM buffer, as"]
    #[doc = "           measured from after the data returned from this function is"]
    #[doc = "           removed from the LJM buffer. This should usually be near zero and"]
    #[doc = "           not growing for healthy streams."]
    #[doc = " Note: Returns LJME_NO_SCANS_RETURNED if LJM_STREAM_SCANS_RETURN is"]
    #[doc = "       LJM_STREAM_SCANS_RETURN_ALL_OR_NONE."]
    pub fn LJM_eStreamRead(
        Handle: ::std::os::raw::c_int,
        aData: *mut f64,
        DeviceScanBacklog: *mut ::std::os::raw::c_int,
        LJMScanBacklog: *mut ::std::os::raw::c_int,
    ) -> ::std::os::raw::c_int;
}
extern "C" {
    #[doc = " Name: LJM_eStreamStop"]
    #[doc = " Desc: Stops LJM from streaming any more data from the device, while leaving"]
    #[doc = "       any collected data in the LJM buffer to be read. Stops the device from"]
    #[doc = "       streaming."]
    #[doc = " Para: Handle, a valid handle to an open device."]
    pub fn LJM_eStreamStop(Handle: ::std::os::raw::c_int) -> ::std::os::raw::c_int;
}
extern "C" {
    #[doc = " Name: LJM_NameToAddress"]
    #[doc = " Desc: Takes a Modbus register name as input and produces the corresponding"]
    #[doc = "       Modbus address and type. These two values can serve as input to"]
    #[doc = "       functions that have Address/aAddresses and Type/aTypes as input"]
    #[doc = "       parameters."]
    #[doc = " Para: Name, a null-terminated C-string register identifier. These register"]
    #[doc = "           identifiers can be register names or register alternate names."]
    #[doc = "       Address, output parameter containing the address described by Name."]
    #[doc = "       Type, output parameter containing the type described by Names."]
    #[doc = " Note: If Name is not a valid register identifier, Address will be set to"]
    #[doc = "       LJM_INVALID_NAME_ADDRESS."]
    pub fn LJM_NameToAddress(
        Name: *const ::std::os::raw::c_char,
        Address: *mut ::std::os::raw::c_int,
        Type: *mut ::std::os::raw::c_int,
    ) -> ::std::os::raw::c_int;
}
extern "C" {
    #[doc = " Name: LJM_ErrorToString"]
    #[doc = " Desc: Gets the name of an error code."]
    #[doc = " Para: ErrorCode, the error code to look up."]
    #[doc = "       ErrorString, a pointer to a char array allocated to size"]
    #[doc = "           LJM_MAX_NAME_SIZE, used to return the null-terminated error name."]
    #[doc = " Note: If the constants file that has been loaded does not contain"]
    #[doc = "       ErrorCode, this returns a null-terminated message saying so."]
    #[doc = "       If the constants file could not be opened, this returns a"]
    #[doc = "       null-terminated string saying so and where that constants file was"]
    #[doc = "       expected to be."]
    #[allow(dead_code)]
    pub fn LJM_ErrorToString(
        ErrorCode: ::std::os::raw::c_int,
        ErrorString: *mut ::std::os::raw::c_char,
    );
}
