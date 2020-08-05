import fetch from "node-fetch";
import { replaceWithOneTimeExecutionMethod } from "one-time-execution-method";

import { MultiGroupProvider } from "repository-provider";

/**
 * Provider for gitlab repositories
 *
 */
export class GitlabProvider extends MultiGroupProvider {
  /**
   * Default configuration as given for the cloud privider
   * @return {Object}
   */
  static get attributes() {
    return {
      ...super.attributes,
      "authentication.token" : {
        env: "GITLB_TOKEN",
        mandatory: true,
        private: true,
        type: "string"
      },
      api: {
        description: "URL of the provider api",
        env: "GITLAB_API",
        default: "https://gitlab.com/api/v4",
        type: "string"
      }
    };
  }

  /**
   * All possible base urls
   * @return {string[]} common base urls of all repositories
   */
  get repositoryBases() {
    return [
      "https://gitlab.com/"
    ];
  }

  async initializeRepositories() {
    let url = `repositories/?role=contributor`;

    do {
      const r = await this.fetch(url);
      
      if (!r.ok) {
        break;
      }

      const res = await r.json();

      url = res.next;
      res.values.map(b => {
        const groupName = b.owner.nickname || b.owner.username;
        const group = this.addRepositoryGroup(groupName, b.owner);
        group.addRepository(b.name, b);
      });
    } while (url);
  }

  fetch(url, options = {}) {
    const headers = {
      "PRIVATE-TOKEN": this.authentication.token,

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
