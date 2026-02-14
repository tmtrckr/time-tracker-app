import { Rule } from '../../types';
import { invoke } from './utils';

export const rulesApi = {
  getRules: (): Promise<Rule[]> => {
    return invoke('get_rules');
  },
  
  createRule: (rule: Omit<Rule, 'id'>): Promise<Rule> => {
    return invoke('create_rule', {
      ruleType: rule.rule_type,
      pattern: rule.pattern,
      categoryId: rule.category_id,
      priority: rule.priority,
    });
  },
  
  updateRule: (rule: Rule): Promise<Rule> => {
    return invoke('update_rule', {
      id: rule.id,
      ruleType: rule.rule_type,
      pattern: rule.pattern,
      categoryId: rule.category_id,
      priority: rule.priority,
    });
  },
  
  deleteRule: (id: number): Promise<void> => {
    return invoke('delete_rule', { id });
  },
};
