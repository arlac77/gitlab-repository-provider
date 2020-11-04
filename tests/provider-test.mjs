import test from "ava";
import GitlabProvider from "gitlab-repository-provider";

const REPOSITORY_NAME = "arlac77/sync-test-repository";

const config = GitlabProvider.optionsFromEnvironment(process.env);

test("optionsFromEnvironment undefined", t => {
  t.is(GitlabProvider.optionsFromEnvironment(undefined), undefined);
});

test("optionsFromEnvironment token", t => {
  t.deepEqual(
    GitlabProvider.optionsFromEnvironment({
      BB_TOKEN: "1234"
    }),
    { "authentication.token": "1234", "authentication.type": "token" }
  );
  t.deepEqual(
    GitlabProvider.optionsFromEnvironment({
      BITBUCKET_TOKEN: "1234"
    }),
    { "authentication.token": "1234", "authentication.type": "token" }
  );
});

test("provider branches", async t => {
  const provider = new GitlabProvider(config);
  const repository = await provider.repository(REPOSITORY_NAME);

  t.is(repository.name, "sync-test-repository");
  t.is(
    repository.urls.find(u => u.startsWith("http")),
    "https://gitlab.com/arlac77/sync-test-repository.git"
  );

  for await (const branch of repository.branches("master")) {
    t.is(branch.name, "master");
  }
});

test("provider repository undefined", async t => {
  const provider = new GitlabProvider(config);
  const repository = await provider.repository(undefined);

  t.is(repository, undefined);
});

test("provider url git@ / ", async t => {
  const provider = new GitlabProvider(config);
  t.is(
    (
      await provider.repository(
        "git@gitlab.com/arlac77/sync-test-repository.git"
      )
    ).name,
    "sync-test-repository"
  );
});

test("provider repo with branch name", async t => {
  const provider = new GitlabProvider(config);
  const branch = await provider.branch(REPOSITORY_NAME + "#master");

  t.is(branch.provider, provider);
  t.is(branch.name, "master");
});
