/* @ts-self-types="./zk_student_wasm.d.ts" */
import * as wasm from "./zk_student_wasm_bg.wasm";
import { __wbg_set_wasm } from "./zk_student_wasm_bg.js";

__wbg_set_wasm(wasm);
wasm.__wbindgen_start();
export { parse_cert, verify_cert } from "./zk_student_wasm_bg.js";
