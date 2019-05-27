// Copyright 2018 MaidSafe.net limited.
//
// This SAFE Network Software is licensed to you under the MIT license <LICENSE-MIT
// http://opensource.org/licenses/MIT> or the Modified BSD license <LICENSE-BSD
// https://opensource.org/licenses/BSD-3-Clause>, at your option. This file may not be copied,
// modified, or distributed except according to those terms. Please review the Licences for the
// specific language governing permissions and limitations relating to use of the SAFE Network
// Software.

//! FFI

#![allow(unsafe_code)]

/// Access container.
pub mod access_container;
/// Cipher options operations.
pub mod cipher_opt;
/// Crypto-related routines.
pub mod crypto;
/// Low level manipulation of `ImmutableData`.
pub mod immutable_data;
/// IPC utilities.
pub mod ipc;
/// Logging operations.
pub mod logging;
/// `MDataInfo` operations.
pub mod mdata_info;
/// Low level manipulation of `MutableData`.
pub mod mutable_data;
/// NFS API.
pub mod nfs;
/// `ObjectCache` handles.
pub mod object_cache;
/// Testing utilities.
#[cfg(any(test, feature = "testing"))]
pub mod test_utils;

mod helper;
#[cfg(test)]
mod tests;

use super::errors::AppError;
use super::App;
use config_file_handler;
use ffi_utils::{catch_unwind_cb, from_c_str, FfiResult, OpaqueCtx, ReprC, FFI_RESULT_OK};
use futures::Future;
use maidsafe_utilities::serialisation::deserialise;
use safe_core::ffi::ipc::resp::AuthGranted;
use safe_core::ffi::AccountInfo;
use safe_core::ipc::{AuthGranted as NativeAuthGranted, BootstrapConfig};
use safe_core::{self, Client, FutureExt};
use std::ffi::{CStr, CString, OsStr};
use std::os::raw::{c_char, c_void};
use std::slice;

/// Create unregistered app.
/// The `user_data` parameter corresponds to the first parameter of the
/// `o_cb` and `o_disconnect_notifier_cb` callbacks.
#[no_mangle]
pub unsafe extern "C" fn app_unregistered(
    bootstrap_config: *const u8,
    bootstrap_config_len: usize,
    user_data: *mut c_void,
    o_disconnect_notifier_cb: extern "C" fn(user_data: *mut c_void),
    o_cb: extern "C" fn(user_data: *mut c_void, result: *const FfiResult, app: *mut App),
) {
    catch_unwind_cb(user_data, o_cb, || -> Result<_, AppError> {
        let user_data = OpaqueCtx(user_data);

        let config = if bootstrap_config_len == 0 || bootstrap_config.is_null() {
            None
        } else {
            let config_serialised = slice::from_raw_parts(bootstrap_config, bootstrap_config_len);
            Some(deserialise::<BootstrapConfig>(config_serialised)?)
        };

        let app = App::unregistered(move || o_disconnect_notifier_cb(user_data.0), config)?;

        o_cb(user_data.0, FFI_RESULT_OK, Box::into_raw(Box::new(app)));

        Ok(())
    })
}

/// Create a registered app.
/// The `user_data` parameter corresponds to the first parameter of the
/// `o_cb` and `o_disconnect_notifier_cb` callbacks.
#[no_mangle]
pub unsafe extern "C" fn app_registered(
    app_id: *const c_char,
    auth_granted: *const AuthGranted,
    user_data: *mut c_void,
    o_disconnect_notifier_cb: extern "C" fn(user_data: *mut c_void),
    o_cb: extern "C" fn(user_data: *mut c_void, result: *const FfiResult, app: *mut App),
) {
    catch_unwind_cb(user_data, o_cb, || -> Result<_, AppError> {
        let user_data = OpaqueCtx(user_data);
        let app_id = from_c_str(app_id)?;
        let auth_granted = NativeAuthGranted::clone_from_repr_c(auth_granted)?;

        let app = App::registered(app_id, auth_granted, move || {
            o_disconnect_notifier_cb(user_data.0)
        })?;

        o_cb(user_data.0, FFI_RESULT_OK, Box::into_raw(Box::new(app)));

        Ok(())
    })
}

/// Try to restore a failed connection with the network.
#[no_mangle]
pub unsafe extern "C" fn app_reconnect(
    app: *mut App,
    user_data: *mut c_void,
    o_cb: extern "C" fn(user_data: *mut c_void, result: *const FfiResult),
) {
    catch_unwind_cb(user_data, o_cb, || -> Result<_, AppError> {
        let user_data = OpaqueCtx(user_data);
        (*app).send(move |client, _| {
            try_cb!(
                client.restart_routing().map_err(AppError::from),
                user_data.0,
                o_cb
            );
            o_cb(user_data.0, FFI_RESULT_OK);
            None
        })
    })
}

/// Returns true if this crate was compiled against mock-routing.
#[no_mangle]
pub extern "C" fn app_is_mock() -> bool 
{
    cfg!(feature = "use-mock-routing")
}
