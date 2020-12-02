import fetch from "node-fetch";
import { replaceWithOneTimeExecutionMethod } from "one-time-execution-method";
import { MultiGroupProvider } from "repository-provider";

const domain = "gitlab.com";

/**
 * Provider for gitlab repositories
 *
 */
export class GitlabProvider extends MultiGroupProvider {
  /**
   * We are called gitlab.
   * @return {string} gitlab
   */
  get name() {
    return "gitlab";
  }

  /**
   * Default configuration as given for the cloud privider
   * @return {Object}
   */
  static get attributes() {
    return {
      ...super.attributes,
      "authentication.token": {
        type: "string",
        description: "API token",
        env: "GITLAB_TOKEN",
        mandatory: true,
        additionalAttributes: { "authentication.type": "token" },
        private: true
      },
      api: {
        description: "URL of the provider api",
        env: "GITLAB_API",
        default: `https://${domain}/api/v4`,
        type: "string"
      }
    };
  }

  /**
   * All possible base urls
   * @return {string[]} common base urls of all repositories
   */
  get repositoryBases() {
    return super.repositoryBases.concat([
      `https://${domain}/`,
      `git@${domain}`
    ]);
  }

  async initializeRepositories() {
    let url = `repositories/?role=contributor`;

    do {
      const r = await this.fetch(url);

      console.log(r);
      if (!r.ok) {
        break;
      }

      const res = await r.json();

      url = res.next;
      res.values.map(b => {
        const groupName = b.owner.nickname || b.owner.username;
        this.addRepositoryGroup(groupName, b.owner).addRepository(b.name, b);
      });
    } while (url);
  }

  fetch(url, options = {}) {
    const headers = {
      //   "PRIVATE-TOKEN": this.authentication.token,
      ...options.headers
    };

    if (options.data) {
      options.body = JSON.stringify(options.data);
      delete options.data;
      headers["Content-Type"] = "application/json";
    }

    return fetch(new URL(url, this.api), {
      ...options,
      headers
    });
  }
}

replaceWithOneTimeExecutionMethod(
  GitlabProvider.prototype,
  "initializeRepositories"
);

export default GitlabProvider;
