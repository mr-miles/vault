/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import { module, test } from 'qunit';
import {
  visit,
  currentURL,
  settled,
  fillIn,
  click,
  waitUntil,
  find,
  currentRouteName,
} from '@ember/test-helpers';
import { setupApplicationTest } from 'vault/tests/helpers';
import { setupMirage } from 'ember-cli-mirage/test-support';
import { create } from 'ember-cli-page-object';
import { selectChoose } from 'ember-power-select/test-support/helpers';
import { runCommands } from 'vault/tests/helpers/pki/pki-run-commands';
import { deleteEngineCmd } from 'vault/tests/helpers/commands';
import authPage from 'vault/tests/pages/auth';
import mountSecrets from 'vault/tests/pages/settings/mount-secret-backend';
import consoleClass from 'vault/tests/pages/components/console/ui-panel';
import clientsHandlers from 'vault/mirage/handlers/clients';
import { formatNumber } from 'core/helpers/format-number';
import { pollCluster } from 'vault/tests/helpers/poll-cluster';
import { disableReplication } from 'vault/tests/helpers/replication';
import connectionPage from 'vault/tests/pages/secrets/backend/database/connection';
import { v4 as uuidv4 } from 'uuid';

import { SELECTORS } from 'vault/tests/helpers/components/dashboard/dashboard-selectors';
import { PAGE } from 'vault/tests/helpers/config-ui/message-selectors';

const consoleComponent = create(consoleClass);

const createNS = async (name) => consoleComponent.runCommands(`write sys/namespaces/${name} -force`);

const authenticatedMessageResponse = {
  request_id: '664fbad0-fcd8-9023-4c5b-81a7962e9f4b',
  lease_id: '',
  renewable: false,
  lease_duration: 0,
  data: {
    key_info: {
      'some-awesome-id-2': {
        authenticated: true,
        end_time: null,
        link: {
          'some link title': 'www.link.com',
        },
        message: 'aGVsbG8gd29ybGQgaGVsbG8gd29scmQ=',
        options: null,
        start_time: '2024-01-04T08:00:00Z',
        title: 'Banner title',
        type: 'banner',
      },
      'some-awesome-id-1': {
        authenticated: true,
        end_time: null,
        message: 'aGVyZSBpcyBhIGNvb2wgbWVzc2FnZQ==',
        options: null,
        start_time: '2024-01-01T08:00:00Z',
        title: 'Modal title',
        type: 'modal',
      },
    },
    keys: ['some-awesome-id-2', 'some-awesome-id-1'],
  },
  wrap_info: null,
  warnings: null,
  auth: null,
  mount_type: '',
};

module('Acceptance | landing page dashboard', function (hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);

  test('navigate to dashboard on login', async function (assert) {
    await authPage.login();
    assert.strictEqual(currentURL(), '/vault/dashboard');
  });

  test('display the version number for the title', async function (assert) {
    await authPage.login();
    await visit('/vault/dashboard');
    const version = this.owner.lookup('service:version');
    // Since we're using mirage, version is mocked static value
    const versionText = version.isEnterprise ? `Vault v1.9.0 root` : `Vault v1.9.0`;

    assert.dom(SELECTORS.cardHeader('Vault version')).hasText(versionText);
  });

  module('secrets engines card', function (hooks) {
    hooks.beforeEach(async function () {
      await authPage.login();
    });

    test('shows a secrets engine card', async function (assert) {
      await mountSecrets.enable('pki', 'pki');
      await settled();
      await visit('/vault/dashboard');
      assert.dom(SELECTORS.cardHeader('Secrets engines')).hasText('Secrets engines');
      // cleanup engine mount
      await consoleComponent.runCommands(deleteEngineCmd('pki'));
    });

    test('it adds disabled css styling to unsupported secret engines', async function (assert) {
      await mountSecrets.enable('nomad', 'nomad');
      await settled();
      await visit('/vault/dashboard');
      assert.dom('[data-test-secrets-engines-row="nomad"] [data-test-view]').doesNotExist();
      // cleanup engine mount
      await consoleComponent.runCommands(deleteEngineCmd('nomad'));
    });
  });

  module('configuration details card', function (hooks) {
    hooks.beforeEach(async function () {
      this.data = {
        api_addr: 'http://127.0.0.1:8200',
        cache_size: 0,
        cluster_addr: 'https://127.0.0.1:8201',
        cluster_cipher_suites: '',
        cluster_name: '',
        default_lease_ttl: 0,
        default_max_request_duration: 0,
        detect_deadlocks: '',
        disable_cache: false,
        disable_clustering: false,
        disable_indexing: false,
        disable_mlock: true,
        disable_performance_standby: false,
        disable_printable_check: false,
        disable_sealwrap: false,
        disable_sentinel_trace: false,
        enable_response_header_hostname: false,
        enable_response_header_raft_node_id: false,
        enable_ui: true,
        experiments: null,
        introspection_endpoint: false,
        listeners: [
          {
            config: {
              address: '0.0.0.0:8200',
              cluster_address: '0.0.0.0:8201',
              tls_disable: true,
            },
            type: 'tcp',
          },
        ],
        log_format: '',
        log_level: 'debug',
        log_requests_level: '',
        max_lease_ttl: '48h',
        pid_file: '',
        plugin_directory: '',
        plugin_file_permissions: 0,
        plugin_file_uid: 0,
        raw_storage_endpoint: true,
        seals: [
          {
            disabled: false,
            type: 'shamir',
          },
        ],
        storage: {
          cluster_addr: 'https://127.0.0.1:8201',
          disable_clustering: false,
          raft: {
            max_entry_size: '',
          },
          redirect_addr: 'http://127.0.0.1:8200',
          type: 'raft',
        },
        telemetry: {
          add_lease_metrics_namespace_labels: false,
          circonus_api_app: '',
          circonus_api_token: '',
          circonus_api_url: '',
          circonus_broker_id: '',
          circonus_broker_select_tag: '',
          circonus_check_display_name: '',
          circonus_check_force_metric_activation: '',
          circonus_check_id: '',
          circonus_check_instance_id: '',
          circonus_check_search_tag: '',
          circonus_check_tags: '',
          circonus_submission_interval: '',
          circonus_submission_url: '',
          disable_hostname: true,
          dogstatsd_addr: '',
          dogstatsd_tags: null,
          lease_metrics_epsilon: 3600000000000,
          maximum_gauge_cardinality: 500,
          metrics_prefix: '',
          num_lease_metrics_buckets: 168,
          prometheus_retention_time: 86400000000000,
          stackdriver_debug_logs: false,
          stackdriver_location: '',
          stackdriver_namespace: '',
          stackdriver_project_id: '',
          statsd_address: '',
          statsite_address: '',
          usage_gauge_period: 5000000000,
        },
      };

      this.server.get('sys/config/state/sanitized', () => ({
        data: this.data,
        wrap_info: null,
        warnings: null,
        auth: null,
      }));
    });

    test('hides the configuration details card on a non-root namespace enterprise version', async function (assert) {
      await authPage.login();
      await visit('/vault/dashboard');
      const version = this.owner.lookup('service:version');
      assert.true(version.isEnterprise, 'vault is enterprise');
      assert.dom(SELECTORS.cardName('configuration-details')).exists();
      createNS('world');
      await visit('/vault/dashboard?namespace=world');
      assert.dom(SELECTORS.cardName('configuration-details')).doesNotExist();
    });

    test('shows the configuration details card', async function (assert) {
      await authPage.login();
      await visit('/vault/dashboard');
      assert.dom(SELECTORS.cardHeader('configuration')).hasText('Configuration details');
      assert
        .dom(SELECTORS.vaultConfigurationCard.configDetailsField('api_addr'))
        .hasText('http://127.0.0.1:8200');
      assert.dom(SELECTORS.vaultConfigurationCard.configDetailsField('default_lease_ttl')).hasText('0');
      assert.dom(SELECTORS.vaultConfigurationCard.configDetailsField('max_lease_ttl')).hasText('2 days');
      assert.dom(SELECTORS.vaultConfigurationCard.configDetailsField('tls')).hasText('Disabled'); // tls_disable=true
      assert.dom(SELECTORS.vaultConfigurationCard.configDetailsField('log_format')).hasText('None');
      assert.dom(SELECTORS.vaultConfigurationCard.configDetailsField('log_level')).hasText('debug');
      assert.dom(SELECTORS.vaultConfigurationCard.configDetailsField('type')).hasText('raft');
    });

    test('it should show tls as enabled if tls_disable, tls_cert_file and tls_key_file are in the config', async function (assert) {
      this.data.listeners[0].config.tls_disable = false;
      this.data.listeners[0].config.tls_cert_file = './cert.pem';
      this.data.listeners[0].config.tls_key_file = './key.pem';

      await authPage.login();
      await visit('/vault/dashboard');
      assert.dom(SELECTORS.vaultConfigurationCard.configDetailsField('tls')).hasText('Enabled');
    });

    test('it should show tls as enabled if only cert and key exist in config', async function (assert) {
      delete this.data.listeners[0].config.tls_disable;
      this.data.listeners[0].config.tls_cert_file = './cert.pem';
      this.data.listeners[0].config.tls_key_file = './key.pem';
      await authPage.login();
      await visit('/vault/dashboard');
      assert.dom(SELECTORS.vaultConfigurationCard.configDetailsField('tls')).hasText('Enabled');
    });

    test('it should show tls as disabled if there is no tls information in the config', async function (assert) {
      this.data.listeners = [];
      await authPage.login();
      await visit('/vault/dashboard');
      assert.dom(SELECTORS.vaultConfigurationCard.configDetailsField('tls')).hasText('Disabled');
    });
  });

  module('quick actions card', function (hooks) {
    hooks.beforeEach(async function () {
      await authPage.login();
    });

    test('shows the default state of the quick actions card', async function (assert) {
      assert.dom(SELECTORS.emptyState('no-mount-selected')).exists();
    });

    test('shows the correct actions and links associated with pki', async function (assert) {
      const backend = 'pki-dashboard';
      await mountSecrets.enable('pki', backend);
      await runCommands([
        `write ${backend}/roles/some-role \
      issuer_ref="default" \
      allowed_domains="example.com" \
      allow_subdomains=true \
      max_ttl="720h"`,
      ]);
      await runCommands([
        `write ${backend}/root/generate/internal issuer_name="Hashicorp" common_name="Hello"`,
      ]);
      await settled();
      await visit('/vault/dashboard');
      await selectChoose(SELECTORS.searchSelect('secrets-engines'), backend);
      await fillIn(SELECTORS.selectEl, 'Issue certificate');
      assert.dom(SELECTORS.emptyState('quick-actions')).doesNotExist();
      assert.dom(SELECTORS.subtitle('param')).hasText('Role to use');

      await selectChoose(SELECTORS.searchSelect('params'), 'some-role');
      assert.dom(SELECTORS.actionButton('Issue leaf certificate')).exists({ count: 1 });
      await click(SELECTORS.actionButton('Issue leaf certificate'));
      assert.strictEqual(currentRouteName(), 'vault.cluster.secrets.backend.pki.roles.role.generate');

      await visit('/vault/dashboard');

      await selectChoose(SELECTORS.searchSelect('secrets-engines'), backend);
      await fillIn(SELECTORS.selectEl, 'View certificate');
      assert.dom(SELECTORS.emptyState('quick-actions')).doesNotExist();
      assert.dom(SELECTORS.subtitle('param')).hasText('Certificate serial number');
      assert.dom(SELECTORS.actionButton('View certificate')).exists({ count: 1 });
      await selectChoose(SELECTORS.searchSelect('params'), '.ember-power-select-option', 0);
      await click(SELECTORS.actionButton('View certificate'));
      assert.strictEqual(
        currentRouteName(),
        'vault.cluster.secrets.backend.pki.certificates.certificate.details'
      );

      await visit('/vault/dashboard');

      await selectChoose(SELECTORS.searchSelect('secrets-engines'), backend);
      await fillIn(SELECTORS.selectEl, 'View issuer');
      assert.dom(SELECTORS.emptyState('quick-actions')).doesNotExist();
      assert.dom(SELECTORS.subtitle('param')).hasText('Issuer');
      assert.dom(SELECTORS.actionButton('View issuer')).exists({ count: 1 });
      await selectChoose(SELECTORS.searchSelect('params'), '.ember-power-select-option', 0);
      await click(SELECTORS.actionButton('View issuer'));
      assert.strictEqual(currentRouteName(), 'vault.cluster.secrets.backend.pki.issuers.issuer.details');

      // cleanup engine mount
      await consoleComponent.runCommands(deleteEngineCmd(backend));
    });

    const newConnection = async (backend, plugin = 'mongodb-database-plugin') => {
      const name = `connection-${Date.now()}`;
      await connectionPage.visitCreate({ backend });
      await connectionPage.dbPlugin(plugin);
      await connectionPage.name(name);
      await connectionPage.connectionUrl(`mongodb://127.0.0.1:4321/${name}`);
      await connectionPage.toggleVerify();
      await connectionPage.save();
      await connectionPage.enable();
      return name;
    };

    test('shows the correct actions and links associated with database', async function (assert) {
      const databaseBackend = `database-${uuidv4()}`;
      await mountSecrets.enable('database', databaseBackend);
      await newConnection(databaseBackend);
      await runCommands([
        `write ${databaseBackend}/roles/my-role \
        db_name=mongodb-database-plugin \
        creation_statements='{ "db": "admin", "roles": [{ "role": "readWrite" }, {"role": "read", "db": "foo"}] }' \
        default_ttl="1h" \
        max_ttl="24h`,
      ]);
      await settled();
      await visit('/vault/dashboard');
      await selectChoose(SELECTORS.searchSelect('secrets-engines'), databaseBackend);
      await fillIn(SELECTORS.selectEl, 'Generate credentials for database');
      assert.dom(SELECTORS.emptyState('quick-actions')).doesNotExist();
      assert.dom(SELECTORS.subtitle('param')).hasText('Role to use');
      assert.dom(SELECTORS.actionButton('Generate credentials')).exists({ count: 1 });
      await selectChoose(SELECTORS.searchSelect('params'), '.ember-power-select-option', 0);
      await click(SELECTORS.actionButton('Generate credentials'));
      assert.strictEqual(currentRouteName(), 'vault.cluster.secrets.backend.credentials');
      await consoleComponent.runCommands(deleteEngineCmd(databaseBackend));
    });

    test('does not show kv1 mounts', async function (assert) {
      // delete before in case you are rerunning the test and it fails without deleting
      await consoleComponent.runCommands(deleteEngineCmd('kv1'));
      await consoleComponent.runCommands([`write sys/mounts/kv1 type=kv`]);
      await settled();
      await visit('/vault/dashboard');
      await click('[data-test-component="search-select"] .ember-basic-dropdown-trigger');
      assert
        .dom('.ember-power-select-option')
        .doesNotHaveTextContaining('kv1', 'dropdown does not show kv1 mount');
      await consoleComponent.runCommands(deleteEngineCmd('kv1'));
    });
  });

  module('client counts card enterprise', function (hooks) {
    hooks.beforeEach(async function () {
      clientsHandlers(this.server);
      this.store = this.owner.lookup('service:store');

      await authPage.login();
    });

    test('shows the client count card for enterprise', async function (assert) {
      const version = this.owner.lookup('service:version');
      assert.true(version.isEnterprise, 'version is enterprise');
      assert.strictEqual(currentURL(), '/vault/dashboard');
      assert.dom(SELECTORS.cardName('client-count')).exists();
      const response = await this.store.peekRecord('clients/activity', 'some-activity-id');
      assert.dom('[data-test-client-count-title]').hasText('Client count');
      assert.dom('[data-test-stat-text="total-clients"] .stat-label').hasText('Total');
      assert
        .dom('[data-test-stat-text="total-clients"] .stat-value')
        .hasText(formatNumber([response.total.clients]));
      assert.dom('[data-test-stat-text="new-clients"] .stat-label').hasText('New');
      assert
        .dom('[data-test-stat-text="new-clients"] .stat-text')
        .hasText('The number of clients new to Vault in the current month.');
      assert
        .dom('[data-test-stat-text="new-clients"] .stat-value')
        .hasText(formatNumber([response.byMonth.lastObject.new_clients.clients]));
    });
  });

  module('replication card enterprise', function (hooks) {
    hooks.beforeEach(async function () {
      await authPage.login();
      await settled();
      await disableReplication('dr');
      await settled();
      await disableReplication('performance');
      await settled();
    });

    test('shows the replication card empty state in enterprise version', async function (assert) {
      await visit('/vault/dashboard');
      const version = this.owner.lookup('service:version');
      assert.true(version.isEnterprise, 'vault is enterprise');
      assert.dom(SELECTORS.emptyState('replication')).exists();
      assert.dom(SELECTORS.emptyStateTitle('replication')).hasText('Replication not set up');
      assert
        .dom(SELECTORS.emptyStateMessage('replication'))
        .hasText('Data will be listed here. Enable a primary replication cluster to get started.');
      assert.dom(SELECTORS.emptyStateActions('replication')).hasText('Enable replication');
    });

    test('hides the replication card on a non-root namespace enterprise version', async function (assert) {
      await visit('/vault/dashboard');
      const version = this.owner.lookup('service:version');
      assert.true(version.isEnterprise, 'vault is enterprise');
      assert.dom(SELECTORS.cardName('replication')).exists();
      createNS('blah');
      await visit('/vault/dashboard?namespace=blah');
      assert.dom(SELECTORS.cardName('replication')).doesNotExist();
    });

    test('it should show replication status if both dr and performance replication are enabled as features in enterprise', async function (assert) {
      const version = this.owner.lookup('service:version');
      assert.true(version.isEnterprise, 'vault is enterprise');
      await visit('/vault/replication');
      assert.strictEqual(currentURL(), '/vault/replication');
      await click('[data-test-replication-type-select="performance"]');
      await fillIn('[data-test-replication-cluster-mode-select]', 'primary');
      await click('[data-test-replication-enable]');
      await pollCluster(this.owner);
      assert.ok(
        await waitUntil(() => find('[data-test-replication-dashboard]')),
        'details dashboard is shown'
      );
      await visit('/vault/dashboard');
      assert.dom(SELECTORS.title('DR primary')).hasText('DR primary');
      assert.dom(SELECTORS.tooltipTitle('DR primary')).hasText('not set up');
      assert.dom(SELECTORS.tooltipIcon('dr-perf', 'DR primary', 'x-circle')).exists();
      assert.dom(SELECTORS.title('Performance primary')).hasText('Performance primary');
      assert.dom(SELECTORS.tooltipTitle('Performance primary')).hasText('running');
      assert.dom(SELECTORS.tooltipIcon('dr-perf', 'Performance primary', 'check-circle')).exists();
    });
  });

  module('custom messages auth tests', function (hooks) {
    hooks.beforeEach(function () {
      return this.server.get('/sys/internal/ui/mounts', () => ({}));
    });

    test('it shows the alert banner and modal message', async function (assert) {
      this.server.get('/sys/internal/ui/unauthenticated-messages', function () {
        return authenticatedMessageResponse;
      });
      await visit('/vault/dashboard');
      const modalId = 'some-awesome-id-1';
      const alertId = 'some-awesome-id-2';
      assert.dom(PAGE.modal(modalId)).exists();
      assert.dom(PAGE.modalTitle(modalId)).hasText('Modal title');
      assert.dom(PAGE.modalBody(modalId)).exists();
      assert.dom(PAGE.modalBody(modalId)).hasText('here is a cool message');
      await click(PAGE.modalButton(modalId));
      assert.dom(PAGE.alertTitle(alertId)).hasText('Banner title');
      assert.dom(PAGE.alertDescription(alertId)).hasText('hello world hello wolrd');
      assert.dom(PAGE.alertAction('link')).hasText('some link title');
    });
    test('it shows the multiple modal messages', async function (assert) {
      const modalIdOne = 'some-awesome-id-2';
      const modalIdTwo = 'some-awesome-id-1';

      this.server.get('/sys/internal/ui/unauthenticated-messages', function () {
        authenticatedMessageResponse.data.key_info[modalIdOne].type = 'modal';
        authenticatedMessageResponse.data.key_info[modalIdOne].title = 'Modal title 1';
        authenticatedMessageResponse.data.key_info[modalIdTwo].type = 'modal';
        authenticatedMessageResponse.data.key_info[modalIdTwo].title = 'Modal title 2';
        return authenticatedMessageResponse;
      });
      await visit('/vault/dashboard');
      assert.dom(PAGE.modal(modalIdOne)).exists();
      assert.dom(PAGE.modalTitle(modalIdOne)).hasText('Modal title 1');
      assert.dom(PAGE.modalBody(modalIdOne)).exists();
      assert.dom(PAGE.modalBody(modalIdOne)).hasText('hello world hello wolrd some link title');
      await click(PAGE.modalButton(modalIdOne));
      assert.dom(PAGE.modal(modalIdTwo)).exists();
      assert.dom(PAGE.modalTitle(modalIdTwo)).hasText('Modal title 2');
      assert.dom(PAGE.modalBody(modalIdTwo)).exists();
      assert.dom(PAGE.modalBody(modalIdTwo)).hasText('here is a cool message');
      await click(PAGE.modalButton(modalIdTwo));
    });
    test('it shows the multiple banner messages', async function (assert) {
      const bannerIdOne = 'some-awesome-id-2';
      const bannerIdTwo = 'some-awesome-id-1';

      this.server.get('/sys/internal/ui/unauthenticated-messages', function () {
        authenticatedMessageResponse.data.key_info[bannerIdOne].type = 'banner';
        authenticatedMessageResponse.data.key_info[bannerIdOne].title = 'Banner title 1';
        authenticatedMessageResponse.data.key_info[bannerIdTwo].type = 'banner';
        authenticatedMessageResponse.data.key_info[bannerIdTwo].title = 'Banner title 2';
        return authenticatedMessageResponse;
      });
      await visit('/vault/dashboard');
      assert.dom(PAGE.alertTitle(bannerIdOne)).hasText('Banner title 1');
      assert.dom(PAGE.alertDescription(bannerIdOne)).hasText('hello world hello wolrd');
      assert.dom(PAGE.alertAction('link')).hasText('some link title');
      assert.dom(PAGE.alertTitle(bannerIdTwo)).hasText('Banner title 2');
      assert.dom(PAGE.alertDescription(bannerIdTwo)).hasText('here is a cool message');
    });
  });
});
