cmake_minimum_required(VERSION 3.20)
project(GridInverseMetaverseUmbrella VERSION 1.0.0 LANGUAGES NONE)

find_program(NODE_EXE node REQUIRED)
find_program(NPM_EXE npm REQUIRED)
find_program(PYTHON_EXE python3 REQUIRED)

add_custom_target(install_deps
    COMMAND ${NPM_EXE} install
    WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
    COMMENT "Installing workspace dependencies across monorepo"
)

add_custom_target(validate_c4
    COMMAND ${NODE_EXE} packages/c4-model/src/index.js validate
    WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
    COMMENT "Validating C4 Model Architecture & Generating Diagram"
)

add_custom_target(lint_env
    COMMAND ${NODE_EXE} packages/env-guard/src/index.js .env.example
    WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
    COMMENT "Running env-guard linter against environment manifests"
)

add_custom_target(vector_parse
    COMMAND ${PYTHON_EXE} tools/vector_flatten_parser.py --root . --out dist/manifest_vectors.jsonl --drive-id 14 --status 2 --code 3 --sort sequential
    WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
    COMMENT "Flattening *.* files & binding 12D Vector Parse Phase (DISC 14/2/3)"
)

add_custom_target(smoke_probe
    COMMAND ${NODE_EXE} packages/smoke-probe/src/index.js --target http://localhost:4173
    WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
    COMMENT "Executing CI/CD end-to-end endpoint smoke probes"
)

add_custom_target(test_iso_discs
    COMMAND ${NODE_EXE} --test packages/iso-discs-cis/test/iso-discs.test.js
    WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
    COMMENT "Running ISO DISCS CIS MVC and registry tests"
)

add_custom_target(build_all ALL
    DEPENDS validate_c4 lint_env vector_parse test_iso_discs
    COMMENT "Umbrella build complete: C4 validated, env linted, vectors bound, ISO DISCS tested"
)
