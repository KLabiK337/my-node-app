const {
    initProject,
    deployProject
} = require('../services/projectService');

describe(
    'CLI services',
    () => {

        test(
            'initProject возвращает путь проекта',
            () => {

                const result =
                    initProject(
                        'test-project',
                        'cli'
                    );

                expect(result)
                    .toContain(
                        'test-project'
                    );

            }
        );


        test(
            'deployProject возвращает URL',
            () => {

                const result =
                    deployProject(
                        'production'
                    );

                expect(result.url)
                    .toContain(
                        'https://'
                    );

            }
        );

    }
);