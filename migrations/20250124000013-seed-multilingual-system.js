'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const [languages] = await queryInterface.sequelize.query(
        `SELECT lang_id, lang_code, lang_name FROM mst_languages WHERE lang_is_active = true ORDER BY lang_name`,
        { transaction }
      );

      const [organizations] = await queryInterface.sequelize.query(
        `SELECT org_id, org_name FROM org_organizations ORDER BY org_name`,
        { transaction }
      );

      const translationKeys = [];
      const translations = [];
      const orgLanguageSettings = [];
      const currentDate = new Date();

      const coreTranslationKeys = [
        { category: 'common', key: 'welcome', description: 'Welcome message' },
        { category: 'common', key: 'logout', description: 'Logout button' },
        { category: 'common', key: 'save', description: 'Save button' },
        { category: 'common', key: 'cancel', description: 'Cancel button' },
        { category: 'common', key: 'delete', description: 'Delete button' },
        { category: 'common', key: 'edit', description: 'Edit button' },
        { category: 'common', key: 'search', description: 'Search placeholder' },
        { category: 'common', key: 'filter', description: 'Filter button' },

        { category: 'navigation', key: 'dashboard', description: 'Dashboard menu item' },
        { category: 'navigation', key: 'employees', description: 'Employees menu item' },
        { category: 'navigation', key: 'leave', description: 'Leave menu item' },
        { category: 'navigation', key: 'attendance', description: 'Attendance menu item' },
        { category: 'navigation', key: 'payroll', description: 'Payroll menu item' },
        { category: 'navigation', key: 'reports', description: 'Reports menu item' },

        { category: 'employee', key: 'employee_id', description: 'Employee ID label' },
        { category: 'employee', key: 'first_name', description: 'First name label' },
        { category: 'employee', key: 'last_name', description: 'Last name label' },
        { category: 'employee', key: 'department', description: 'Department label' },
        { category: 'employee', key: 'position', description: 'Position label' },
        { category: 'employee', key: 'hire_date', description: 'Hire date label' },

        { category: 'leave', key: 'leave_request', description: 'Leave request title' },
        { category: 'leave', key: 'leave_type', description: 'Leave type label' },
        { category: 'leave', key: 'start_date', description: 'Start date label' },
        { category: 'leave', key: 'end_date', description: 'End date label' },
        { category: 'leave', key: 'status_pending', description: 'Pending status' },
        { category: 'leave', key: 'status_approved', description: 'Approved status' },
        { category: 'leave', key: 'status_rejected', description: 'Rejected status' },

        { category: 'attendance', key: 'clock_in', description: 'Clock in button' },
        { category: 'attendance', key: 'clock_out', description: 'Clock out button' },
        { category: 'attendance', key: 'total_hours', description: 'Total hours label' },
        { category: 'attendance', key: 'overtime', description: 'Overtime label' }
      ];

      const translationValues = {
        en: {
          welcome: 'Welcome', logout: 'Logout', save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit', search: 'Search', filter: 'Filter',
          dashboard: 'Dashboard', employees: 'Employees', leave: 'Leave', attendance: 'Attendance', payroll: 'Payroll', reports: 'Reports',
          employee_id: 'Employee ID', first_name: 'First Name', last_name: 'Last Name', department: 'Department', position: 'Position', hire_date: 'Hire Date',
          leave_request: 'Leave Request', leave_type: 'Leave Type', start_date: 'Start Date', end_date: 'End Date',
          status_pending: 'Pending', status_approved: 'Approved', status_rejected: 'Rejected',
          clock_in: 'Clock In', clock_out: 'Clock Out', total_hours: 'Total Hours', overtime: 'Overtime'
        },
        es: {
          welcome: 'Bienvenido', logout: 'Cerrar sesión', save: 'Guardar', cancel: 'Cancelar', delete: 'Eliminar', edit: 'Editar', search: 'Buscar', filter: 'Filtrar',
          dashboard: 'Panel', employees: 'Empleados', leave: 'Ausencia', attendance: 'Asistencia', payroll: 'Nómina', reports: 'Informes',
          employee_id: 'ID de Empleado', first_name: 'Nombre', last_name: 'Apellido', department: 'Departamento', position: 'Posición', hire_date: 'Fecha de Contratación',
          leave_request: 'Solicitud de Ausencia', leave_type: 'Tipo de Ausencia', start_date: 'Fecha de Inicio', end_date: 'Fecha de Fin',
          status_pending: 'Pendiente', status_approved: 'Aprobado', status_rejected: 'Rechazado',
          clock_in: 'Marcar Entrada', clock_out: 'Marcar Salida', total_hours: 'Horas Totales', overtime: 'Horas Extra'
        },
        fr: {
          welcome: 'Bienvenue', logout: 'Déconnexion', save: 'Enregistrer', cancel: 'Annuler', delete: 'Supprimer', edit: 'Modifier', search: 'Rechercher', filter: 'Filtrer',
          dashboard: 'Tableau de bord', employees: 'Employés', leave: 'Congé', attendance: 'Présence', payroll: 'Paie', reports: 'Rapports',
          employee_id: 'ID Employé', first_name: 'Prénom', last_name: 'Nom', department: 'Département', position: 'Poste', hire_date: 'Date d\'Embauche',
          leave_request: 'Demande de Congé', leave_type: 'Type de Congé', start_date: 'Date de Début', end_date: 'Date de Fin',
          status_pending: 'En attente', status_approved: 'Approuvé', status_rejected: 'Rejeté',
          clock_in: 'Pointer Entrée', clock_out: 'Pointer Sortie', total_hours: 'Heures Totales', overtime: 'Heures Supplémentaires'
        },
        de: {
          welcome: 'Willkommen', logout: 'Abmelden', save: 'Speichern', cancel: 'Abbrechen', delete: 'Löschen', edit: 'Bearbeiten', search: 'Suchen', filter: 'Filtern',
          dashboard: 'Dashboard', employees: 'Mitarbeiter', leave: 'Urlaub', attendance: 'Anwesenheit', payroll: 'Gehaltsabrechnung', reports: 'Berichte',
          employee_id: 'Mitarbeiter-ID', first_name: 'Vorname', last_name: 'Nachname', department: 'Abteilung', position: 'Position', hire_date: 'Einstellungsdatum',
          leave_request: 'Urlaubsantrag', leave_type: 'Urlaubstyp', start_date: 'Startdatum', end_date: 'Enddatum',
          status_pending: 'Ausstehend', status_approved: 'Genehmigt', status_rejected: 'Abgelehnt',
          clock_in: 'Einstempeln', clock_out: 'Ausstempeln', total_hours: 'Gesamtstunden', overtime: 'Überstunden'
        },
        it: {
          welcome: 'Benvenuto', logout: 'Disconnetti', save: 'Salva', cancel: 'Annulla', delete: 'Elimina', edit: 'Modifica', search: 'Cerca', filter: 'Filtra',
          dashboard: 'Dashboard', employees: 'Dipendenti', leave: 'Permesso', attendance: 'Presenza', payroll: 'Buste paga', reports: 'Report',
          employee_id: 'ID Dipendente', first_name: 'Nome', last_name: 'Cognome', department: 'Dipartimento', position: 'Posizione', hire_date: 'Data di Assunzione',
          leave_request: 'Richiesta Permesso', leave_type: 'Tipo Permesso', start_date: 'Data Inizio', end_date: 'Data Fine',
          status_pending: 'In attesa', status_approved: 'Approvato', status_rejected: 'Rifiutato',
          clock_in: 'Timbratura Entrata', clock_out: 'Timbratura Uscita', total_hours: 'Ore Totali', overtime: 'Straordinario'
        },
        pt: {
          welcome: 'Bem-vindo', logout: 'Sair', save: 'Salvar', cancel: 'Cancelar', delete: 'Excluir', edit: 'Editar', search: 'Pesquisar', filter: 'Filtrar',
          dashboard: 'Painel', employees: 'Funcionários', leave: 'Ausência', attendance: 'Presença', payroll: 'Folha de Pagamento', reports: 'Relatórios',
          employee_id: 'ID do Funcionário', first_name: 'Nome', last_name: 'Sobrenome', department: 'Departamento', position: 'Cargo', hire_date: 'Data de Contratação',
          leave_request: 'Pedido de Ausência', leave_type: 'Tipo de Ausência', start_date: 'Data de Início', end_date: 'Data de Término',
          status_pending: 'Pendente', status_approved: 'Aprovado', status_rejected: 'Rejeitado',
          clock_in: 'Marcar Entrada', clock_out: 'Marcar Saída', total_hours: 'Horas Totais', overtime: 'Horas Extras'
        },
        ja: {
          welcome: 'ようこそ', logout: 'ログアウト', save: '保存', cancel: 'キャンセル', delete: '削除', edit: '編集', search: '検索', filter: 'フィルター',
          dashboard: 'ダッシュボード', employees: '従業員', leave: '休暇', attendance: '出席', payroll: '給与', reports: 'レポート',
          employee_id: '従業員ID', first_name: '名', last_name: '姓', department: '部門', position: '役職', hire_date: '入社日',
          leave_request: '休暇申請', leave_type: '休暇種類', start_date: '開始日', end_date: '終了日',
          status_pending: '保留中', status_approved: '承認済み', status_rejected: '却下',
          clock_in: '出勤', clock_out: '退勤', total_hours: '合計時間', overtime: '残業'
        },
        zh: {
          welcome: '欢迎', logout: '登出', save: '保存', cancel: '取消', delete: '删除', edit: '编辑', search: '搜索', filter: '筛选',
          dashboard: '仪表板', employees: '员工', leave: '请假', attendance: '考勤', payroll: '工资单', reports: '报告',
          employee_id: '员工ID', first_name: '名', last_name: '姓', department: '部门', position: '职位', hire_date: '入职日期',
          leave_request: '请假申请', leave_type: '请假类型', start_date: '开始日期', end_date: '结束日期',
          status_pending: '待处理', status_approved: '已批准', status_rejected: '已拒绝',
          clock_in: '打卡上班', clock_out: '打卡下班', total_hours: '总时长', overtime: '加班'
        }
      };

      coreTranslationKeys.forEach(keyDef => {
        const keyId = uuidv4();
        translationKeys.push({
          key_id: keyId,
          key_name: `${keyDef.category}.${keyDef.key}`,
          key_category: keyDef.category,
          key_description: keyDef.description,
          is_active: true,
          created_at: currentDate,
          updated_at: currentDate
        });

        languages.forEach(lang => {
          const langCode = lang.lang_code.toLowerCase();
          const value = translationValues[langCode]?.[keyDef.key] || translationValues['en'][keyDef.key];

          translations.push({
            translation_id: uuidv4(),
            key_id: keyId,
            language_id: lang.lang_id,
            translation_value: value,
            is_active: true,
            created_at: currentDate,
            updated_at: currentDate
          });
        });
      });

      organizations.forEach(org => {
        const defaultLang = languages.find(l => l.lang_code.toLowerCase() === 'en');
        const supportedLanguages = languages.slice(0, 3).map(l => l.lang_id);

        orgLanguageSettings.push({
          setting_id: uuidv4(),
          organization_id: org.org_id,
          default_language_id: defaultLang.lang_id,
          supported_language_ids: JSON.stringify(supportedLanguages),
          fallback_language_id: defaultLang.lang_id,
          is_active: true,
          created_at: currentDate,
          updated_at: currentDate
        });
      });

      if (translationKeys.length > 0) {
        await queryInterface.bulkInsert('i18n_translation_keys', translationKeys, { transaction });
        console.log(`✅ Seeded ${translationKeys.length} translation keys`);
      }

      if (translations.length > 0) {
        await queryInterface.bulkInsert('i18n_translations', translations, { transaction });
        console.log(`✅ Seeded ${translations.length} translations`);
      }

      if (orgLanguageSettings.length > 0) {
        await queryInterface.bulkInsert('org_language_settings', orgLanguageSettings, { transaction });
        console.log(`✅ Seeded ${orgLanguageSettings.length} organization language settings`);
      }

      await transaction.commit();
      console.log(`\n✅ Successfully seeded multilingual system:`);
      console.log(`   - ${translationKeys.length} translation keys across ${coreTranslationKeys.map(k => k.category).filter((v,i,a) => a.indexOf(v) === i).length} categories`);
      console.log(`   - ${translations.length} translations (${languages.length} languages × ${translationKeys.length} keys)`);
      console.log(`   - ${orgLanguageSettings.length} organization language configurations`);
      console.log(`   - Supported languages: ${languages.map(l => l.lang_name).join(', ')}`);

    } catch (error) {
      await transaction.rollback();
      console.error('❌ Failed to seed multilingual system:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.bulkDelete('org_language_settings', {
        created_at: {
          [Sequelize.Op.gte]: '2025-01-24 00:00:00'
        }
      }, { transaction });

      await queryInterface.bulkDelete('i18n_translations', {
        created_at: {
          [Sequelize.Op.gte]: '2025-01-24 00:00:00'
        }
      }, { transaction });

      await queryInterface.bulkDelete('i18n_translation_keys', {
        created_at: {
          [Sequelize.Op.gte]: '2025-01-24 00:00:00'
        }
      }, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};