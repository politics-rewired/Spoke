import { ApolloQueryResult } from "apollo-client/core/types";
import { CannedResponse } from "../../../../api/canned-response";
import { FullComponentProps } from "../../components/SectionWrapper";

export interface Values {
  cannedResponses: CannedResponse[];
}

export interface HocProps {
  mutations: {
    editCampaign(payload: Values): ApolloQueryResult<any>;
  };
  data: {
    campaign: {
      id: string;
      cannedResponses: CannedResponse[];
      isStarted: boolean;
      customFields: string[];
    };
  };
}

export interface InnerProps extends FullComponentProps, HocProps {}

export interface State {
  cannedResponsesToAdd: CannedResponse[];
  cannedResponseIdsToDelete: string[];
  editedCannedResponses: CannedResponse[];
  editingResponse?: CannedResponse;
  isWorking: boolean;
  shouldShowEditor: boolean;
}

export enum ResponseEditorContext {
  CreatingResponse = 'creating-response',
  EditingResponse = 'editing-response'
}

export enum ResponseEditKey {
  Title = 'title',
  Text = 'text'
}

export interface CannedResponseDialogProps extends CannedResponseEditorProps, CreatedCannedResponseFormProps {
  open: boolean;
  context: ResponseEditorContext;
}

export interface CannedResponseEditorProps {
  editingResponse: CannedResponse;
  customFields: string[];
  onEditCannedResponse(key: ResponseEditKey, value: string): void;
  onSaveResponseEdit(): void;
  onCancel(): void;
}

export interface CreatedCannedResponseFormProps {
  customFields: string[];
  onCancel(): void;
  onSaveCannedResponse(...args: any[]): void;
}